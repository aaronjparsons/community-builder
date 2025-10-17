import { STATE, MAP_HEIGHT, MAP_WIDTH } from './constants';

// Zoom settings
const MIN_SCALE = 0.5; // Maximum zoom out (50% of original size)
const MAX_SCALE = 1.0; // Maximum zoom in (100% of original size)
const ZOOM_SPEED = 0.0005;
const ZOOM_SMOOTHING = 0.15;

// Inertia settings
const FRICTION = 0.95;
const MIN_VELOCITY = 0.1;
const MAX_VELOCITY = 30;

export class MapControls {
    constructor(app, onStateChange) {
        this.app = app;
        this.onStateChange = onStateChange;
        this.currentScale = 1.0;
        this.targetScale = 1.0;
        this.isZooming = false;
        this.isDragging = false;
        this.lastMousePosition = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastTime = 0;
        this.animationFrameId = null;
        this.lastTouchDistance = 0;
        this.isPinching = false;

        // Bind event handlers to maintain this context
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.updateZoom = this.updateZoom.bind(this);
        this.updateInertia = this.updateInertia.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.app.canvas) return;

        // Mouse events
        this.app.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.app.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.app.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.app.canvas.addEventListener('mouseleave', this.handleMouseUp);
        this.app.canvas.addEventListener('wheel', this.handleZoom, { passive: false });

        // Touch events
        this.app.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.app.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.app.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.app.canvas.addEventListener('touchcancel', this.handleTouchEnd);

        window.addEventListener('resize', this.handleResize);
    }

    destroy() {
        if (this.app.canvas) {
            // Mouse events
            this.app.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.app.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.app.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.app.canvas.removeEventListener('mouseleave', this.handleMouseUp);
            this.app.canvas.removeEventListener('wheel', this.handleZoom);

            // Touch events
            this.app.canvas.removeEventListener('touchstart', this.handleTouchStart);
            this.app.canvas.removeEventListener('touchmove', this.handleTouchMove);
            this.app.canvas.removeEventListener('touchend', this.handleTouchEnd);
            this.app.canvas.removeEventListener('touchcancel', this.handleTouchEnd);

            window.removeEventListener('resize', this.handleResize);
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    calculateMinScale() {
        const viewportWidth = this.app.screen.width;
        const viewportHeight = this.app.screen.height;

        const scaleX = viewportWidth / MAP_WIDTH;
        const scaleY = viewportHeight / MAP_HEIGHT;

        const fitScale = Math.max(scaleX, scaleY);
        return Math.max(fitScale, MIN_SCALE);
    }

    calculateBounds() {
        const viewportWidth = this.app.screen.width;
        const viewportHeight = this.app.screen.height;

        const scaledWidth = MAP_WIDTH * this.currentScale;
        const scaledHeight = MAP_HEIGHT * this.currentScale;

        const maxRight = Math.max(0, viewportWidth - scaledWidth);
        const maxBottom = Math.max(0, viewportHeight - scaledHeight);

        return {
            minX: Math.min(-scaledWidth + viewportWidth, 0),
            maxX: maxRight,
            minY: Math.min(-scaledHeight + viewportHeight, 0),
            maxY: maxBottom
        };
    }

    constrainPosition(x, y) {
        const bounds = this.calculateBounds();
        const constrainedX = Math.min(Math.max(x, bounds.minX), bounds.maxX);
        const constrainedY = Math.min(Math.max(y, bounds.minY), bounds.maxY);

        if (this.currentScale < 1) {
            const viewportWidth = this.app.screen.width;
            const viewportHeight = this.app.screen.height;
            const scaledWidth = MAP_WIDTH * this.currentScale;
            const scaledHeight = MAP_HEIGHT * this.currentScale;

            if (scaledWidth < viewportWidth) {
                return {
                    x: (viewportWidth - scaledWidth) / 2,
                    y: constrainedY
                };
            }
            if (scaledHeight < viewportHeight) {
                return {
                    x: constrainedX,
                    y: (viewportHeight - scaledHeight) / 2
                };
            }
        }

        return { x: constrainedX, y: constrainedY };
    }

    updateZoom(timestamp) {
        if (Math.abs(this.currentScale - this.targetScale) > 0.001) {
            this.currentScale += (this.targetScale - this.currentScale) * ZOOM_SMOOTHING;

            this.app.stage.scale.set(this.currentScale);

            const { x, y } = this.constrainPosition(this.app.stage.x, this.app.stage.y);
            this.app.stage.x = x;
            this.app.stage.y = y;

            this.animationFrameId = requestAnimationFrame(this.updateZoom);
        } else {
            this.isZooming = false;
        }
    }

    handleZoom(event) {
        event.preventDefault();

        const rect = this.app.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const worldX = (mouseX - this.app.stage.x) / this.currentScale;
        const worldY = (mouseY - this.app.stage.y) / this.currentScale;

        const delta = -event.deltaY * ZOOM_SPEED;
        const proposedScale = this.currentScale + delta;
        const dynamicMinScale = this.calculateMinScale();
        const newScale = Math.min(Math.max(proposedScale, dynamicMinScale), MAX_SCALE);

        if (newScale !== this.currentScale) {
            this.app.stage.scale.set(newScale);
            this.currentScale = newScale;

            const newStageX = mouseX - (worldX * newScale);
            const newStageY = mouseY - (worldY * newScale);

            const { x, y } = this.constrainPosition(newStageX, newStageY);
            this.app.stage.x = x;
            this.app.stage.y = y;

            this.targetScale = newScale;

            if (!this.isZooming) {
                this.isZooming = true;
                this.animationFrameId = requestAnimationFrame(this.updateZoom);
            }
        }
    }

    handleMouseDown(event) {
        if (this.isZooming) return;
        this.isDragging = true;
        this.velocity = { x: 0, y: 0 };
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.lastMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
        this.app.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(event) {
        if (!this.isDragging) return;

        const dx = event.clientX - this.lastMousePosition.x;
        const dy = event.clientY - this.lastMousePosition.y;

        this.velocity.x = Math.min(Math.max(dx * 0.8, -MAX_VELOCITY), MAX_VELOCITY);
        this.velocity.y = Math.min(Math.max(dy * 0.8, -MAX_VELOCITY), MAX_VELOCITY);

        const newX = this.app.stage.x + dx;
        const newY = this.app.stage.y + dy;

        const { x, y } = this.constrainPosition(newX, newY);
        this.app.stage.x = x;
        this.app.stage.y = y;

        this.lastMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    handleMouseUp() {
        this.isDragging = false;
        this.app.canvas.style.cursor = 'grab';
        this.startInertia();
    }

    startInertia() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.updateInertia);
    }

    updateInertia(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.velocity.x *= FRICTION;
        this.velocity.y *= FRICTION;

        if (Math.abs(this.velocity.x) < MIN_VELOCITY) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < MIN_VELOCITY) this.velocity.y = 0;

        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const newX = this.app.stage.x + this.velocity.x;
            const newY = this.app.stage.y + this.velocity.y;

            const { x, y } = this.constrainPosition(newX, newY);
            this.app.stage.x = x;
            this.app.stage.y = y;

            if ((x === newX && Math.abs(this.velocity.x) < MIN_VELOCITY) ||
                (y === newY && Math.abs(this.velocity.y) < MIN_VELOCITY)) {
                this.velocity.x = 0;
                this.velocity.y = 0;
            }

            if (this.velocity.x !== 0 || this.velocity.y !== 0) {
                this.animationFrameId = requestAnimationFrame(this.updateInertia);
            } else {
                this.animationFrameId = null;
            }
        } else {
            this.animationFrameId = null;
        }
    }

    handleResize() {
        const newMinScale = this.calculateMinScale();
        if (newMinScale > this.currentScale) {
            this.currentScale = newMinScale;
            this.targetScale = newMinScale;
            this.app.stage.scale.set(this.currentScale);
        }
        const { x, y } = this.constrainPosition(this.app.stage.x, this.app.stage.y);
        this.app.stage.x = x;
        this.app.stage.y = y;
    }

    initialize() {
        const initialMinScale = this.calculateMinScale();
        if (initialMinScale > this.currentScale) {
            this.currentScale = initialMinScale;
            this.targetScale = initialMinScale;
            this.app.stage.scale.set(this.currentScale);
        }
        const { x, y } = this.constrainPosition(this.app.stage.x, this.app.stage.y);
        this.app.stage.x = x;
        this.app.stage.y = y;
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    handleTouchStart(event) {
        event.preventDefault();

        if (event.touches.length === 2) {
            this.isPinching = true;
            this.isDragging = false;
            this.lastTouchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
            this.lastMousePosition = this.getTouchCenter(event.touches[0], event.touches[1]);
        } else if (event.touches.length === 1 && !this.isPinching) {
            this.isDragging = true;
            this.velocity = { x: 0, y: 0 };
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.lastMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            this.app.canvas.style.cursor = 'grabbing';
        }
    }

    handleTouchMove(event) {
        event.preventDefault();

        if (this.isPinching && event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = this.getTouchDistance(touch1, touch2);
            const center = this.getTouchCenter(touch1, touch2);

            // Calculate zoom delta
            const delta = (currentDistance - this.lastTouchDistance) * 0.01;
            const rect = this.app.canvas.getBoundingClientRect();
            const mouseX = center.x - rect.left;
            const mouseY = center.y - rect.top;

            // Use the same zoom logic as mouse wheel
            const worldX = (mouseX - this.app.stage.x) / this.currentScale;
            const worldY = (mouseY - this.app.stage.y) / this.currentScale;

            const proposedScale = this.currentScale + delta;
            const dynamicMinScale = this.calculateMinScale();
            const newScale = Math.min(Math.max(proposedScale, dynamicMinScale), MAX_SCALE);

            if (newScale !== this.currentScale) {
                this.app.stage.scale.set(newScale);
                this.currentScale = newScale;

                const newStageX = mouseX - (worldX * newScale);
                const newStageY = mouseY - (worldY * newScale);

                const { x, y } = this.constrainPosition(newStageX, newStageY);
                this.app.stage.x = x;
                this.app.stage.y = y;

                this.targetScale = newScale;

                if (!this.isZooming) {
                    this.isZooming = true;
                    this.animationFrameId = requestAnimationFrame(this.updateZoom);
                }
            }

            this.lastTouchDistance = currentDistance;
            this.lastMousePosition = center;
        } else if (this.isDragging && event.touches.length === 1) {
            const touch = event.touches[0];
            const dx = touch.clientX - this.lastMousePosition.x;
            const dy = touch.clientY - this.lastMousePosition.y;

            this.velocity.x = Math.min(Math.max(dx * 0.8, -MAX_VELOCITY), MAX_VELOCITY);
            this.velocity.y = Math.min(Math.max(dy * 0.8, -MAX_VELOCITY), MAX_VELOCITY);

            const newX = this.app.stage.x + dx;
            const newY = this.app.stage.y + dy;

            const { x, y } = this.constrainPosition(newX, newY);
            this.app.stage.x = x;
            this.app.stage.y = y;

            this.lastMousePosition = {
                x: touch.clientX,
                y: touch.clientY
            };
        }
    }

    handleTouchEnd(event) {
        if (event.touches.length < 2) {
            this.isPinching = false;
        }
        if (event.touches.length === 0) {
            this.isDragging = false;
            this.app.canvas.style.cursor = 'grab';
            this.startInertia();
        }
    }
}