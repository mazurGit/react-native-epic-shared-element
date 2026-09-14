#import "EpicSharedElementView.h"
#import <float.h>
#import <math.h>

@interface EpicSharedElementView ()
@property(nonatomic, strong) CADisplayLink *displayLink;
@property(nonatomic, assign) CGRect sampledFrame;
@property(nonatomic, assign) CGRect emittedFrame;
@property(nonatomic, assign) NSUInteger stableSampleCount;
@property(nonatomic, assign) BOOL emittedStable;
@property(nonatomic, assign) CFTimeInterval lastEmissionTime;
@end

static const NSUInteger EpicStableSampleCount = 2;
static const CGFloat EpicFrameEpsilon = 0.5;

static BOOL EpicFramesEqual(CGRect lhs, CGRect rhs) {
  if (CGRectIsNull(lhs) || CGRectIsNull(rhs)) return NO;
  return fabs(lhs.origin.x - rhs.origin.x) <= EpicFrameEpsilon &&
      fabs(lhs.origin.y - rhs.origin.y) <= EpicFrameEpsilon &&
      fabs(lhs.size.width - rhs.size.width) <= EpicFrameEpsilon &&
      fabs(lhs.size.height - rhs.size.height) <= EpicFrameEpsilon;
}

@implementation EpicSharedElementView

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    _sampledFrame = CGRectNull;
    _emittedFrame = CGRectNull;
    _lastEmissionTime = -DBL_MAX;
  }
  return self;
}

- (void)invalidateMeasurement {
  self.sampledFrame = CGRectNull;
  self.emittedFrame = CGRectNull;
  self.stableSampleCount = 0;
  self.emittedStable = NO;
  self.lastEmissionTime = -DBL_MAX;
  if (self.window) [self startTracking];
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  if (self.window) [self invalidateMeasurement];
  else [self stopTracking];
}

- (void)startTracking {
  if (self.displayLink) return;
  self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(emitFrame)];
  [self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)stopTracking {
  [self.displayLink invalidate];
  self.displayLink = nil;
}

- (void)setAncestorTag:(NSNumber *)value {
  if ([_ancestorTag isEqualToNumber:value]) return;
  _ancestorTag = value;
  [self invalidateMeasurement];
}

- (void)setTrackFrame:(BOOL)value {
  _trackFrame = value;
  [self invalidateMeasurement];
}

- (void)setBorderRadius:(NSNumber *)value {
  _borderRadius = value;
  [self invalidateMeasurement];
}

- (void)dealloc {
  [self.displayLink invalidate];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  // Measure after the mounting transaction, not halfway through ancestor layout.
  [self invalidateMeasurement];
}

- (void)emitFrame {
  if (!self.onFrame || !self.window || self.bounds.size.width <= 0 || self.bounds.size.height <= 0) {
    if (!self.trackFrame || !self.window) [self stopTracking];
    return;
  }
  UIView *ancestor = [self ancestorView];
  // A missing/unmounted host is not permission to switch to window coordinates.
  if (!ancestor) {
    if (!self.trackFrame) [self stopTracking];
    return;
  }
  CGRect frame = [self layoutFrameInAncestor:ancestor];
  if (CGRectIsNull(frame)) return;
  BOOL sameFrame = EpicFramesEqual(frame, self.sampledFrame);
  if (sameFrame) {
    self.stableSampleCount += 1;
  } else {
    self.sampledFrame = frame;
    self.stableSampleCount = 1;
  }
  BOOL stable = self.stableSampleCount >= EpicStableSampleCount;
  BOOL shouldEmit = CGRectIsNull(self.emittedFrame) ||
      !EpicFramesEqual(frame, self.emittedFrame) || stable != self.emittedStable;
  CFTimeInterval now = CACurrentMediaTime();
  if (shouldEmit &&
      !(self.throttle > 0 && (now - self.lastEmissionTime) * 1000 < self.throttle)) {
    self.emittedFrame = frame;
    self.emittedStable = stable;
    self.lastEmissionTime = now;
    NSMutableDictionary *event = [@{
      @"x": @(frame.origin.x), @"y": @(frame.origin.y),
      @"width": @(frame.size.width), @"height": @(frame.size.height),
      @"stable": @(stable)
    } mutableCopy];
    if (self.borderRadius) event[@"borderRadius"] = self.borderRadius;
    self.onFrame(event);
  }
  if (!self.trackFrame && self.emittedStable) [self stopTracking];
}

- (CGRect)layoutFrameInAncestor:(UIView *)ancestor {
  CGRect frame = self.bounds;
  UIView *view = self;
  while (view && view != ancestor) {
    UIView *superview = view.superview;
    if (!superview) return CGRectNull;
    // Layout coordinates intentionally exclude presentation transforms.
    CGPoint origin = CGPointMake(
        view.layer.position.x - view.layer.anchorPoint.x * view.bounds.size.width,
        view.layer.position.y - view.layer.anchorPoint.y * view.bounds.size.height);
    frame.origin.x += origin.x - view.bounds.origin.x;
    frame.origin.y += origin.y - view.bounds.origin.y;
    view = superview;
  }
  return view == ancestor ? frame : CGRectNull;
}

- (UIView *)ancestorView {
  if (!self.ancestorTag || self.ancestorTag.integerValue <= 0) return nil;
  UIView *candidate = self.superview;
  while (candidate) {
    // Fabric stores the native ID in UIView.tag; Paper uses reactTag.
    if (candidate.tag == self.ancestorTag.integerValue ||
        ([candidate respondsToSelector:@selector(reactTag)] &&
         [((UIView<RCTComponent> *)candidate).reactTag isEqualToNumber:self.ancestorTag])) {
      return candidate;
    }
    candidate = candidate.superview;
  }
  return nil;
}
@end
