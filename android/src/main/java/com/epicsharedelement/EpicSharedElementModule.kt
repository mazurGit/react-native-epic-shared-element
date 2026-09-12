package com.epicsharedelement

import com.facebook.react.bridge.ReactApplicationContext

class EpicSharedElementModule(reactContext: ReactApplicationContext) :
  NativeEpicSharedElementSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeEpicSharedElementSpec.NAME
  }
}
