import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Globe, Palette, Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { preferences, saveSettings, isLoading } = useUserSettings();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    weeklyDigest: true,
    timezone: "Europe/Lisbon",
    compactMode: false,
    twoFactorAuth: false,
    sessionTimeout: "30",
  });

  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
      setSettings(prev => ({ ...prev, ...preferences }));
    }
  }, [preferences]);

  const handleSave = () => {
    saveSettings.mutate(settings);
  };

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />{t("common.saveChanges")}</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />{t("settings.notifications")}</CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t("settings.emailNotifications")}</Label><p className="text-sm text-muted-foreground">{t("settings.emailNotificationsDesc")}</p></div>
              <Switch checked={settings.emailNotifications} onCheckedChange={(checked) => updateSetting("emailNotifications", checked)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t("settings.pushNotifications")}</Label><p className="text-sm text-muted-foreground">{t("settings.pushNotificationsDesc")}</p></div>
              <Switch checked={settings.pushNotifications} onCheckedChange={(checked) => updateSetting("pushNotifications", checked)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t("settings.taskReminders")}</Label><p className="text-sm text-muted-foreground">{t("settings.taskRemindersDesc")}</p></div>
              <Switch checked={settings.taskReminders} onCheckedChange={(checked) => updateSetting("taskReminders", checked)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t("settings.weeklyDigest")}</Label><p className="text-sm text-muted-foreground">{t("settings.weeklyDigestDesc")}</p></div>
              <Switch checked={settings.weeklyDigest} onCheckedChange={(checked) => updateSetting("weeklyDigest", checked)} />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />{t("settings.appearance")}</CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.theme")}</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value)}>
                <SelectTrigger><SelectValue placeholder={t("settings.selectTheme")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                  <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                  <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t("settings.compactMode")}</Label><p className="text-sm text-muted-foreground">{t("settings.compactModeDesc")}</p></div>
              <Switch checked={settings.compactMode} onCheckedChange={(checked) => updateSetting("compactMode", checked)} />
            </div>
          </CardContent>
        </Card>

        {/* Regional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{t("settings.regionLanguage")}</CardTitle>
            <CardDescription>{t("settings.regionLanguageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <Select value={i18n.language?.substring(0, 2)} onValueChange={handleLanguageChange}>
                <SelectTrigger><SelectValue placeholder={t("settings.selectLanguage")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>{t("settings.timezone")}</Label>
              <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                <SelectTrigger><SelectValue placeholder={t("settings.selectTimezone")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="Africa/Luanda">Luanda (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />{t("settings.security")}</CardTitle>
            <CardDescription>{t("settings.securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t("settings.twoFactor")}</Label><p className="text-sm text-muted-foreground">{t("settings.twoFactorDesc")}</p></div>
              <Switch checked={settings.twoFactorAuth} onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>{t("settings.sessionTimeout")}</Label>
              <Select value={settings.sessionTimeout} onValueChange={(value) => updateSetting("sessionTimeout", value)}>
                <SelectTrigger><SelectValue placeholder={t("settings.selectTimeout")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 {t("settings.minutes")}</SelectItem>
                  <SelectItem value="30">30 {t("settings.minutes")}</SelectItem>
                  <SelectItem value="60">1 {t("settings.hour")}</SelectItem>
                  <SelectItem value="120">2 {t("settings.hours")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{t("settings.sessionTimeoutDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
