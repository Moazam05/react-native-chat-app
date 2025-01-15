import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const toastConfig = {
  error: {
    gradientColors: ['#FFF5F5', '#FFF9F9', '#FFFFFF'],
    icon: 'error-outline',
    iconColor: '#e72324',
  },
  success: {
    gradientColors: ['#F0FFF4', '#F7FFF9', '#FFFFFF'],
    icon: 'check-circle-outline',
    iconColor: '#2e7d33',
  },
  warning: {
    gradientColors: ['#FFFFF0', '#FFFFF7', '#FFFFFF'],
    icon: 'warning-amber',
    iconColor: '#FFC107',
  },
  info: {
    gradientColors: ['#F0F7FF', '#F7FAFF', '#FFFFFF'],
    icon: 'info-outline',
    iconColor: '#2196F3',
  },
};

const ToastBase = ({type, title, subtitle}) => {
  const config = toastConfig[type];

  return (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={config.gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.gradientBackground}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name={config.icon} size={20} color={config.iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const ErrorToast = ({text2}) => (
  <ToastBase
    type="error"
    title={'Error'}
    subtitle={
      text2 || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...'
    }
  />
);

const SuccessToast = ({text2}) => (
  <ToastBase
    type="success"
    title={'Success'}
    subtitle={text2 || 'Operation completed successfully'}
  />
);

const WarningToast = ({text2}) => (
  <ToastBase
    type="warning"
    title={'Warning'}
    subtitle={text2 || 'Please check your input and try again'}
  />
);

const InfoToast = ({text2}) => (
  <ToastBase
    type="info"
    title={'Information'}
    subtitle={text2 || "Here's something you should know"}
  />
);

const ToastComponent = () => {
  const config = {
    error: ErrorToast,
    success: SuccessToast,
    warning: WarningToast,
    info: InfoToast,
  };

  return <Toast config={config} visibilityTime={3000} swipeable={false} />;
};

const styles = StyleSheet.create({
  toastContainer: {
    width: 300,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  gradientBackground: {
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 12,
    color: '#4A5568',
    lineHeight: 20,
  },
});

export default ToastComponent;
