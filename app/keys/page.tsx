'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KeysPage() {
  const router = useRouter();
  const [productionApiKey, setProductionApiKey] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      if (response.ok) {
        const data = await response.json();
        setProductionApiKey(data.productionApiKey);
        setWebhookSecret(data.webhookSecret);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, keyType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyType);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <p className="text-gray-400">Loading API keys...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">
            Your API keys are generated automatically when you sign up. Keep them secure and never share them publicly.
          </p>
        </div>

        <div className="space-y-6">
          {/* Production API Key */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Production API Key</h2>
                <p className="text-sm text-gray-400">Use this key for production API calls</p>
              </div>
            </div>
            
            {productionApiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-md border border-gray-700 bg-gray-800 p-4">
                  <code className="flex-1 font-mono text-sm text-gray-300 break-all">
                    {productionApiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(productionApiKey, 'production')}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
                  >
                    {copiedKey === 'production' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Format: payzo_live_&lt;64 hex characters&gt;
                </p>
              </div>
            ) : (
              <p className="text-gray-400">API key not found. Please contact support.</p>
            )}
          </div>

          {/* Webhook Secret */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Webhook Secret</h2>
                <p className="text-sm text-gray-400">Use this secret to verify webhook signatures</p>
              </div>
            </div>
            
            {webhookSecret ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-md border border-gray-700 bg-gray-800 p-4">
                  <code className="flex-1 font-mono text-sm text-gray-300 break-all">
                    {webhookSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(webhookSecret, 'webhook')}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
                  >
                    {copiedKey === 'webhook' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Format: whsec_&lt;64 hex characters&gt;
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Webhook secret not found. Please contact support.</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Security Notice</h3>
            <ul className="text-sm text-yellow-200 space-y-1 list-disc list-inside">
              <li>Never share your API keys publicly or commit them to version control</li>
              <li>Keep your webhook secret secure and use it to verify webhook authenticity</li>
              <li>If your keys are compromised, contact support immediately to regenerate them</li>
              <li>Use environment variables to store keys in your applications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

