export {};

declare global {
  interface Window {
    electronAPI?: {
      openMoodleLogin: () => Promise<{ session_cookie: string; sesskey: string } | null>;
      sendNotification: (title: string, body: string) => void;
      windowControls?: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        isMaximized: () => Promise<boolean>;
      };
    };
  }
}
