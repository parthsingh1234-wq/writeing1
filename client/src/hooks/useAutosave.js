import { useState, useEffect, useRef } from 'react';

export const useAutosave = (saveFunction, data, interval = 5000) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const lastSavedData = useRef(JSON.stringify(data));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      const currentDataStr = JSON.stringify(data);
      if (currentDataStr !== lastSavedData.current) {
        setSaveStatus('saving');
        try {
          await saveFunction(data);
          lastSavedData.current = currentDataStr;
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveStatus('error');
        }
      }
    }, interval);

    return () => clearTimeout(timer);
  }, [data, saveFunction, interval]);

  return { saveStatus, setSaveStatus };
};
