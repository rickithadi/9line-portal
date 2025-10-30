'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader, CheckCircle, AlertCircle, X, Globe } from 'lucide-react';
import type { GetAppResponse, App, PipedreamClient as FrontendClient } from "@pipedream/sdk/browser";

interface PipedreamConnectProps {
  externalUserId: string;
  onAccountConnected?: (accountId: string, accountName: string, appSlug: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface ConnectResult {
  id: string;
}

interface ConnectStatus {
  successful: boolean;
  completed: boolean;
}

interface ConnectConfig {
  app: string;
  token?: string;
  onSuccess: (result: ConnectResult) => void;
  onError?: (error: Error) => void;
  onClose?: (status: ConnectStatus) => void;
}

const PipedreamConnect: React.FC<PipedreamConnectProps> = ({
  externalUserId,
  onAccountConnected,
  onError,
  className = ""
}) => {
  // Core Pipedream Connect state
  const [token, setToken] = useState<string | null>(null);
  const [connectLink, setConnectLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [pd, setPd] = useState<FrontendClient | null>(null);
  
  // Selected app and connection state
  const [selectedApp, setSelectedApp] = useState<GetAppResponse | null>(null);
  const [appSlug, setAppSlug] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  
  // UI state
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // App search dropdown state
  const [searchResults, setSearchResults] = useState<App[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreApps, setHasMoreApps] = useState(true);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Refs
  const tokenCreationInProgress = useRef<boolean>(false);
  const tokenRef = useRef<string | null>(null);
  const expiresAtRef = useRef<Date | null>(null);
  const appsPageRef = useRef<Awaited<ReturnType<FrontendClient["apps"]["list"]>> | null>(null);

  const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com";
  const apiHost = process.env.NEXT_PUBLIC_PIPEDREAM_API_HOST || "api.pipedream.com";

  useEffect(() => {
    tokenRef.current = token;
    expiresAtRef.current = expiresAt;
  }, [token, expiresAt]);

  // Initialize Pipedream client
  useEffect(() => {
    if (!externalUserId || !token || pd) {
      return;
    }

    async function loadClient() {
      try {
        const { createFrontendClient } = await import('@pipedream/sdk/browser');
        const client = createFrontendClient({
          frontendHost,
          externalUserId,
          token: token!,
          tokenCallback: async () => {
            if (!externalUserId) {
              throw new Error("No external user ID provided");
            }

            const currentToken = tokenRef.current;
            const currentExpiresAt = expiresAtRef.current;
            if (currentToken && currentExpiresAt && currentExpiresAt > new Date()) {
              return {
                token: currentToken,
                expiresAt: currentExpiresAt,
                connectLinkUrl: connectLink || '',
              };
            }

            const res = await fetch("/api/pipedream/token", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ externalUserId }),
            });

            if (!res.ok) {
              throw new Error("Failed to refresh connect token");
            }

            const response = await res.json();
            const nextExpiresAt = ensureDate(response.expiresAt);
            setToken(response.token);
            setConnectLink(response.connectLinkUrl);
            setExpiresAt(nextExpiresAt);

            return {
              token: response.token,
              expiresAt: nextExpiresAt,
              connectLinkUrl: response.connectLinkUrl,
            };
          },
        });
        setPd(client);
      } catch (error) {
        console.error('Error loading Pipedream client:', error);
        setError('Failed to initialize Pipedream client');
      }
    }

    loadClient();
  }, [externalUserId, token, pd, frontendHost, apiHost]);

  // Create initial token
  useEffect(() => {
    if (token || tokenCreationInProgress.current || !externalUserId) return;
    
    tokenCreationInProgress.current = true;
    
    (async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/pipedream/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ externalUserId }),
        });

        if (!response.ok) {
          throw new Error("Failed to create token");
        }

        const data = await response.json();
        setToken(data.token);
        setConnectLink(data.connectLinkUrl);
        setExpiresAt(ensureDate(data.expiresAt));
      } catch (error) {
        console.error("Error creating token:", error);
        setError("Failed to initialize Pipedream integration");
        onError?.("Failed to initialize Pipedream integration");
      } finally {
        setLoading(false);
        tokenCreationInProgress.current = false;
      }
    })();
  }, [externalUserId, token, onError]);

  const ensureDate = (value: Date | string): Date =>
    value instanceof Date ? value : new Date(value);

  const getAccountById = async (accountId: string) => {
    const response = await fetch(`/api/pipedream/accounts/${accountId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch account details");
    }
    const data = await response.json();
    // Return the first account from the list that matches the ID
    return data.data?.find((account: any) => account.id === accountId) || { id: accountId, name: accountId };
  };

  const connectApp = async (appSlug: string) => {
    if (!externalUserId || !token || !pd) {
      throw new Error("Pipedream client not ready");
    }
    
    setAppSlug(appSlug);
    setLoading(true);
    
    const connectConfig: ConnectConfig = {
      app: appSlug,
      token,
      onSuccess: async ({ id }: ConnectResult) => {
        try {
          setAccountId(id);
          
          // Fetch account details
          const account = await getAccountById(id);
          setAccountName(account.name);
          
          // Notify parent component
          onAccountConnected?.(id, account.name, appSlug);
          
          // Create new token after successful connection
          const newTokenResponse = await fetch("/api/pipedream/token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ externalUserId }),
          });
          
          if (newTokenResponse.ok) {
            const data = await newTokenResponse.json();
            setToken(data.token);
            setConnectLink(data.connectLinkUrl);
            setExpiresAt(ensureDate(data.expiresAt));
          }
        } catch (error) {
          console.error('Error handling successful connection:', error);
        } finally {
          setLoading(false);
        }
      },
      onError: (error: Error) => {
        console.error('Connection error:', error);
        setError(error.message);
        onError?.(error.message);
        setLoading(false);
      },
      onClose: (status: ConnectStatus) => {
        setLoading(false);
      }
    };
    
    pd.connectAccount(connectConfig);
  };

  const handleAppSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAppSlug(value);
    setError("");
    setSelectedIndex(-1);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.length > 0) {
      setShowDropdown(true);
      setIsSearching(true);
      
      const timeout = setTimeout(async () => {
        try {
          setCurrentQuery(value);
          appsPageRef.current = null;
          await searchAppsClient(value, 10);
        } catch (err) {
          console.error("Search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      
      setSearchTimeout(timeout);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
      setIsSearching(false);
      setCurrentQuery("");
      setHasMoreApps(true);
      appsPageRef.current = null;
    }
  };

  const searchAppsClient = useCallback(async (query?: string, limit: number = 10, append: boolean = false): Promise<App[]> => {
    if (!pd) {
      console.error("Pipedream client not loaded");
      return [];
    }

    try {
      const pageLimit = limit * 2;

      if (!append) {
        appsPageRef.current = await pd.apps.list({
          q: query,
          limit: pageLimit,
          sortKey: "featured_weight",
          sortDirection: "desc",
        });
      } else {
        const page = appsPageRef.current;
        if (!page || !page.hasNextPage()) {
          setHasMoreApps(false);
          return [];
        }
        await page.getNextPage();
      }

      const page = appsPageRef.current;
      if (!page) return [];

      const filteredApps = page.data.filter((app) => app.authType !== null);
      const limitedApps = filteredApps.slice(0, limit);

      setHasMoreApps(page.hasNextPage());

      if (append) {
        setSearchResults(prevResults => {
          const existingIds = new Set(prevResults.map(app => app.nameSlug));
          const newApps = limitedApps.filter(app => !existingIds.has(app.nameSlug));
          return [...prevResults, ...newApps];
        });
      } else {
        setSearchResults(limitedApps);
      }

      return limitedApps;
    } catch (error) {
      console.error("Error fetching apps:", error);
      if (!append) {
        setSearchResults([]);
        setHasMoreApps(false);
      }
      return [];
    }
  }, [pd]);

  const handleAppSelect = (app: App) => {
    setAppSlug(app.nameSlug);
    setShowDropdown(false);
    setError("");
    
    const mockResponse: GetAppResponse = { data: app };
    setSelectedApp(mockResponse);
  };

  const handleConnect = async () => {
    if (!selectedApp) return;
    await connectApp(selectedApp.data.nameSlug);
  };

  const handleReset = () => {
    setSelectedApp(null);
    setAppSlug("");
    setAccountId(null);
    setAccountName(null);
    setError("");
  };

  if (loading && !token) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Initializing Pipedream Connect...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg bg-white ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Connect External Services
        </h3>
        <p className="text-sm text-gray-600">
          Connect your accounts to external services for enhanced functionality.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {accountId ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium text-green-700">Account Connected!</span>
          </div>
          <div className="text-sm text-green-600">
            {accountName ? (
              <span><strong>{accountName}</strong> (ID: {accountId})</span>
            ) : (
              <span>Account ID: {accountId}</span>
            )}
          </div>
          <button
            onClick={handleReset}
            className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
          >
            Connect different service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedApp ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedApp.data.imgSrc} 
                    alt={selectedApp.data.name}
                    className="w-8 h-8 rounded"
                  />
                  <div>
                    <div className="font-medium">{selectedApp.data.name}</div>
                    <div className="text-sm text-gray-500">{selectedApp.data.nameSlug}</div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect ${selectedApp.data.name}`
                )}
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="text"
                placeholder="Search for services (e.g., slack, google sheets)"
                value={appSlug}
                onChange={handleAppSlugChange}
                onFocus={() => {
                  if (searchResults.length === 0) {
                    setShowDropdown(true);
                    setIsSearching(true);
                    searchAppsClient(undefined, 10).finally(() => setIsSearching(false));
                  } else {
                    setShowDropdown(true);
                  }
                }}
              />
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-4 py-2 text-gray-500 flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((app, index) => (
                      <div
                        key={app.nameSlug}
                        className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleAppSelect(app)}
                      >
                        <img
                          src={app.imgSrc}
                          alt={app.name}
                          className="w-6 h-6 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.nameSlug}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      No services found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipedreamConnect;