#import "EpicSharedElementView.h"
#import <float.h>
#import <math.h>

@interface EpicSharedElementView ()
@property(nonatomic, strong) CADisplayLink *displayLink;
@property(nonatomic, assign) CGRect sampledFrame;
@property(nonatomic, assign) CGRect emittedFrame;
@property(nonatomic, strong) NSNumber *emittedBorderRadius;
@property(nonatomic, assign) NSUInteger stableSampleCount;
@property(nonatomic, assign) NSUInteger framesSinceEmission;
@property(nonatomic, assign) BOOL hasSettled;
@property(nonatomic, assign) BOOL needsMeasurement;
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
    _needsMeasurement = YES;
    _lastEmissionTime = -DBL_MAX;
  }
  return self;
}

- (void)invalidateMeasurement {
  self.sampledFrame = CGRectNull;
  self.stableSampleCount = 0;
  self.needsMeasurement = YES;
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
  if ((!self.onFrameChange && !self.onFrameSettled) || !self.window ||
      self.bounds.size.width <= 0 || self.bounds.size.height <= 0) {
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
  self.needsMeasurement = NO;
  BOOL sameFrame = EpicFramesEqual(frame, self.sampledFrame);
  if (sameFrame) {
    self.stableSampleCount += 1;
  } else {
    self.sampledFrame = frame;
    self.stableSampleCount = 1;
  }
  if (!CGRectIsNull(self.emittedFrame)) self.framesSinceEmission += 1;
  BOOL frameChanged = CGRectIsNull(self.emittedFrame) ||
      !EpicFramesEqual(frame, self.emittedFrame) ||
      !((self.borderRadius == self.emittedBorderRadius) ||
        [self.borderRadius isEqualToNumber:self.emittedBorderRadius]);
  CFTimeInterval now = CACurrentMediaTime();
  if (frameChanged && self.onFrameChange &&
      !(self.throttle > 0 && (now - self.lastEmissionTime) * 1000 < self.throttle)) {
    id previous = CGRectIsNull(self.emittedFrame)
        ? [NSNull null]
        : [self eventForFrame:self.emittedFrame borderRadius:self.emittedBorderRadius];
    self.onFrameChange(@{
      @"previous": previous,
      @"current": [self eventForFrame:frame borderRadius:self.borderRadius],
      @"framesDiff": @(CGRectIsNull(self.emittedFrame) ? 0 : self.framesSinceEmission)
    });
    self.emittedFrame = frame;
    self.emittedBorderRadius = self.borderRadius;
    self.framesSinceEmission = 0;
    self.lastEmissionTime = now;
  }
  if (!self.hasSettled && self.stableSampleCount >= EpicStableSampleCount) {
    self.hasSettled = YES;
    if (self.onFrameSettled) {
      self.onFrameSettled(@{
        @"current": [self eventForFrame:frame borderRadius:self.borderRadius],
        @"framesCount": @(self.stableSampleCount)
      });
    }
  }
  if (!self.trackFrame && self.hasSettled && !self.needsMeasurement) {
    [self stopTracking];
  }
}

- (NSMutableDictionary *)eventForFrame:(CGRect)frame borderRadius:(NSNumber *)borderRadius {
  NSMutableDictionary *event = [@{
    @"x": @(frame.origin.x), @"y": @(frame.origin.y),
    @"width": @(frame.size.width), @"height": @(frame.size.height)
  } mutableCopy];
  if (borderRadius) event[@"borderRadius"] = borderRadius;
  return event;
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
