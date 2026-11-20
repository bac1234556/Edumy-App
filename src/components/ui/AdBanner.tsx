// src/components/ui/AdBanner.tsx
// Google AdMob BannerAd wrapper (Native Development Build only; silent null on Expo Go / failure).

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getAdMobModule, getBannerAdUnitId } from '../../lib/ads';
import { semantic } from '../../theme/tokens';
import { Text } from './Text';

interface AdBannerProps {
  style?: object;
}

export function AdBanner({ style }: AdBannerProps) {
  const [failed, setFailed] = useState(false);
  const mod = getAdMobModule();

  if (!mod || failed) {
    return null;
  }

  const unitId = getBannerAdUnitId();
  if (!unitId) return null;

  const { BannerAd, BannerAdSize } = mod;

  return (
    <View style={[styles.container, style]}>
      <Text variant="caption" style={styles.adLabel}>
        Quảng cáo
      </Text>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: semantic.surfaceCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  adLabel: {
    fontSize: 10,
    color: semantic.textPlaceholder,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
});
