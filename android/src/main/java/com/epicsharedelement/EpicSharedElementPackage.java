package com.epicsharedelement;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class EpicSharedElementPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext context) {
    return Collections.emptyList();
  }
  @Override
  @SuppressWarnings("rawtypes")
  public List<ViewManager> createViewManagers(ReactApplicationContext context) {
    return Arrays.<ViewManager>asList(new EpicSharedElementView.Manager());
  }
}
