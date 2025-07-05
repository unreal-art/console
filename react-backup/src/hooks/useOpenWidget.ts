
import { useEffect } from 'react';

declare global {
  interface Window {
    __ow?: {
      organizationId: string;
      integration_name: string;
      product_name: string;
    };
    OpenWidget?: {
      call: (method: string) => void;
      on: (event: string, callback: (data: any) => void) => void;
    };
  }
}

export const useOpenWidget = () => {
  useEffect(() => {
    // Set the global __ow object with required properties
    window.__ow = {
      organizationId: "af790b15-da08-49f9-83e1-6d1806f5ef67",
      integration_name: "manual_settings",
      product_name: "openwidget"
    };

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = 'https://cdn.openwidget.com/openwidget.js';
    
    // Configure the widget on load
    script.onload = () => {
      console.log('OpenWidget loaded successfully');
    };

    // Append script to head
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const openWidget = () => {
    if (window.OpenWidget) {
      window.OpenWidget.call('maximize');
    } else {
      // Fallback - open Discord in new tab
      window.open('https://discord.gg/VzPQBKJ5EK', '_blank');
    }
  };

  const closeWidget = () => {
    if (window.OpenWidget) {
      window.OpenWidget.call('minimize');
    }
  };

  const toggleWidget = () => {
    if (window.OpenWidget) {
      window.OpenWidget.call('toggle');
    } else {
      openWidget();
    }
  };

  return {
    openWidget,
    closeWidget,
    toggleWidget
  };
};
