import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export function OysterCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width="60%" height={24} borderRadius={4} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>

      {/* Origin */}
      <Skeleton width="40%" height={16} borderRadius={4} style={styles.spacing} />

      {/* Rating */}
      <Skeleton width={120} height={20} borderRadius={4} style={styles.spacing} />

      {/* Notes */}
      <Skeleton width="100%" height={36} borderRadius={4} style={styles.spacing} />

      {/* Attributes */}
      <View style={styles.attributesContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.attributeItem}>
            <Skeleton width={40} height={12} borderRadius={4} />
            <Skeleton width={30} height={16} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Review count */}
      <Skeleton width={80} height={14} borderRadius={4} style={styles.spacing} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  spacing: {
    marginBottom: 8,
  },
  attributesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginBottom: 8,
  },
  attributeItem: {
    alignItems: 'center',
    minWidth: '18%',
  },
});
