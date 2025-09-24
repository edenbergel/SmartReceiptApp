import { Image, ImageStyle, StyleProp } from 'react-native';

interface LogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Logo({ size = 80, style }: LogoProps) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[{ width: size, height: size, borderRadius: 24 }, style]}
      resizeMode="cover"
    />
  );
}
