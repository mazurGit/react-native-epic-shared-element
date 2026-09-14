package com.epicsharedelement;

import android.content.Context;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewTreeObserver;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.Collections;
import java.util.Map;

public class EpicSharedElementView extends ReactViewGroup {
  private static final int UNSET_COORDINATE = Integer.MIN_VALUE;
  private static final int NO_ANCESTOR = -1;

  private final ViewTreeObserver.OnPreDrawListener preDrawListener = this::emitFrame;

  private int lastX = UNSET_COORDINATE;
  private int lastY = UNSET_COORDINATE;
  private int lastWidth;
  private int lastHeight;
  private int ancestorTag = NO_ANCESTOR;
  private float borderRadius = -1f;
  private long throttleMs;
  private long lastEmissionTime = Long.MIN_VALUE;
  private boolean trackFrame;
  private boolean preDrawListenerAttached;

  public EpicSharedElementView(Context context) {
    super(context);
  }

  public void setThrottle(float value) {
    throttleMs = Math.max(0L, (long) value);
  }

  public void setSharedElementBorderRadius(float value) {
    borderRadius = value;
    resetLastFrame();
    updatePreDrawListener();
  }

  public void setTrackFrame(boolean value) {
    trackFrame = value;
    resetLastFrame();
    updatePreDrawListener();
  }

  public void setAncestorTag(int value) {
    ancestorTag = value;
    resetLastFrame();
    updatePreDrawListener();
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    updatePreDrawListener();
  }

  @Override
  protected void onDetachedFromWindow() {
    removePreDrawListener();
    super.onDetachedFromWindow();
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec)
    );
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);
    if (changed) {
      resetLastFrame();
      updatePreDrawListener();
    }
  }

  private boolean emitFrame() {
    boolean emitted = emitFrame(getWidth(), getHeight());

    if (!trackFrame && lastX != UNSET_COORDINATE) {
      removePreDrawListener();
    }

    return emitted;
  }

  private boolean emitFrame(int width, int height) {
    if (width <= 0 || height <= 0 || !(getContext() instanceof ReactContext)) {
      return true;
    }

    View ancestor = findAncestor();
    if (ancestor == null) return true;

    // Match iOS: layout relative to the host, excluding animated transforms.
    int layoutX = 0;
    int layoutY = 0;
    View current = this;
    while (current != ancestor) {
      if (!(current.getParent() instanceof View)) return true;
      View parent = (View) current.getParent();
      layoutX += current.getLeft();
      layoutY += current.getTop();
      if (parent != ancestor) {
        layoutX -= parent.getScrollX();
        layoutY -= parent.getScrollY();
      }
      current = parent;
    }

    float density = getResources().getDisplayMetrics().density;
    int x = Math.round(layoutX / density);
    int y = Math.round(layoutY / density);
    int widthDp = Math.round(width / density);
    int heightDp = Math.round(height / density);

    if (x == lastX && y == lastY && widthDp == lastWidth && heightDp == lastHeight) {
      return true;
    }

    long now = SystemClock.uptimeMillis();
    if (throttleMs > 0
        && lastEmissionTime != Long.MIN_VALUE
        && now - lastEmissionTime < throttleMs) {
      return true;
    }

    lastX = x;
    lastY = y;
    lastWidth = widthDp;
    lastHeight = heightDp;
    lastEmissionTime = now;

    WritableMap event = Arguments.createMap();
    event.putDouble("x", x);
    event.putDouble("y", y);
    event.putDouble("width", widthDp);
    event.putDouble("height", heightDp);
    if (borderRadius >= 0f) {
      event.putDouble("borderRadius", borderRadius);
    }

    ((ReactContext) getContext())
        .getJSModule(RCTEventEmitter.class)
        .receiveEvent(getId(), "topFrame", event);

    return true;
  }

  private View findAncestor() {
    if (ancestorTag == NO_ANCESTOR || !(getContext() instanceof ReactContext)) {
      return null;
    }

    View current = this;
    while (current.getParent() instanceof View) {
      current = (View) current.getParent();
      if (current.getId() == ancestorTag) {
        return current;
      }
    }

    return null;
  }

  private void resetLastFrame() {
    lastX = UNSET_COORDINATE;
    lastY = UNSET_COORDINATE;
    lastWidth = 0;
    lastHeight = 0;
    lastEmissionTime = Long.MIN_VALUE;
  }

  private void updatePreDrawListener() {
    if (!isAttachedToWindow()) {
      return;
    }

    if (trackFrame || lastX == UNSET_COORDINATE) {
      addPreDrawListener();
    } else {
      removePreDrawListener();
    }
  }

  private void addPreDrawListener() {
    if (!preDrawListenerAttached) {
      getViewTreeObserver().addOnPreDrawListener(preDrawListener);
      preDrawListenerAttached = true;
    }
  }

  private void removePreDrawListener() {
    if (preDrawListenerAttached) {
      getViewTreeObserver().removeOnPreDrawListener(preDrawListener);
      preDrawListenerAttached = false;
    }
  }

  public static class Manager extends ViewGroupManager<EpicSharedElementView> {
    @Override
    public String getName() {
      return "EpicSharedElementView";
    }

    @Override
    protected EpicSharedElementView createViewInstance(ThemedReactContext context) {
      return new EpicSharedElementView(context);
    }

    @com.facebook.react.uimanager.annotations.ReactProp(name = "throttle", defaultFloat = 0f)
    public void setThrottle(EpicSharedElementView view, float value) {
      view.setThrottle(value);
    }

    @com.facebook.react.uimanager.annotations.ReactProp(name = "borderRadius", defaultFloat = -1f)
    public void setBorderRadius(EpicSharedElementView view, float value) {
      view.setSharedElementBorderRadius(value);
    }

    @com.facebook.react.uimanager.annotations.ReactProp(name = "trackFrame", defaultBoolean = false)
    public void setTrackFrame(EpicSharedElementView view, boolean value) {
      view.setTrackFrame(value);
    }

    @com.facebook.react.uimanager.annotations.ReactProp(name = "ancestorTag", defaultInt = -1)
    public void setAncestorTag(EpicSharedElementView view, int value) {
      view.setAncestorTag(value);
    }

    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
      return Collections.singletonMap(
          "topFrame",
          Collections.singletonMap("registrationName", "onFrame")
      );
    }
  }
}
