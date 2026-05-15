'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Save, Trash2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    privateMode: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure? This will delete all your decisions and cannot be undone.')) {
      localStorage.removeItem('decisions');
      localStorage.removeItem('settings');
      window.location.href = '/';
    }
  };

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground mb-8">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your DeciSmart preferences
            </p>
          </div>

          {/* Settings Card */}
          <div className="bg-card border border-border rounded-xl p-8 mb-8">
            <div className="space-y-6">
              {/* Dark Mode */}
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground">Dark Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable dark theme for better night-time viewing
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange('darkMode', !settings.darkMode)
                  }
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about important updates
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange(
                      'emailNotifications',
                      !settings.emailNotifications
                    )
                  }
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.emailNotifications
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Private Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Private Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep all decisions private (no sharing or export)
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange('privateMode', !settings.privateMode)
                  }
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.privateMode ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.privateMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-border">
              {saved && (
                <div className="bg-accent/10 text-accent px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                  ✓ Settings saved successfully
                </div>
              )}
              <Button
                onClick={handleSave}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  These actions are permanent and cannot be undone.
                </p>
              </div>
            </div>

            <Button
              onClick={handleClearAllData}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data & Decisions
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
