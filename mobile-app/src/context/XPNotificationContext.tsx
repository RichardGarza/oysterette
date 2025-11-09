/**
 * XP Notification Context
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface XPNotificationContextType {
  showXPGain: (amount: number, reason: string) => void;
  showAchievement: (name: string, xpReward: number) => void;
  showLevelUp: (newLevel: number) => void;
}

const XPNotificationContext = createContext<XPNotificationContextType | undefined>(undefined);

export const useXPNotification = () => {
  const context = useContext(XPNotificationContext);
  if (!context) {
    throw new Error('useXPNotification must be used within XPNotificationProvider');
  }
  return context;
};

export const XPNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(3000);

  const showXPGain = useCallback((amount: number, reason: string) => {
    setMessage(`+${amount} XP • ${reason}`);
    setDuration(2000);
    setVisible(true);
  }, []);

  const showAchievement = useCallback((name: string, xpReward: number) => {
    setMessage(`🏆 Achievement Unlocked: ${name} (+${xpReward} XP)`);
    setDuration(4000);
    setVisible(true);
  }, []);

  const showLevelUp = useCallback((newLevel: number) => {
    setMessage(`🎉 Level Up! You are now Level ${newLevel}`);
    setDuration(4000);
    setVisible(true);
  }, []);

  return (
    <XPNotificationContext.Provider value={{ showXPGain, showAchievement, showLevelUp }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={duration}
        style={styles.snackbar}
        action={{
          label: '✓',
          onPress: () => setVisible(false),
        }}
      >
        {message}
      </Snackbar>
    </XPNotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 20,
  },
});
