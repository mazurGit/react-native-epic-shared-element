module.exports = {
  testRunner: {
    args: { config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'example/ios/build-e2e/Build/Products/Debug-iphonesimulator/EpicSharedElementExample.app',
      build:
        'xcodebuild -workspace example/ios/EpicSharedElementExample.xcworkspace -scheme EpicSharedElementExample -configuration Debug -sdk iphonesimulator -derivedDataPath example/ios/build-e2e',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'example/android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd example/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_8_Pro_API_36' },
    },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
  },
};
