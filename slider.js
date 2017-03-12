var Slider = function(options) {
	if ((options.maxValue - options.minValue) % options.step !== 0) 
		throw 'Invalid step size!';
	if ((options.maxValue - options.minValue) <= 0) 
		throw 'Max value smaller than min value!';

	this.options = options;
	this.init();
}

Slider.prototype.init = function() {
	var xmlns = 'http://www.w3.org/2000/svg';
	this.sliderId = this.options.legendGroup.getElementsByTagName('text').length;
	this.containerRect = this.options.container.getBoundingClientRect();

	this.sliderWidth = 14;
	this.markerSize = 18;
	this.legendWidth = this.containerRect.width / 4;
	this.textFontSize = 50;
	this.sliderStartAngleDiff = -90;

	this.sliderActive = false;
	this.currentValue = this.options.minValue;

	this.centerX = (this.containerRect.width + this.legendWidth) / 2 ;
	this.centerY = this.containerRect.height / 2;

	this.angleStep = 360 / Math.floor((this.options.maxValue - this.options.minValue) / this.options.step);

	// create legend elements
	this.text = document.createElementNS(xmlns, 'text');
	this.text.setAttribute('fill', "#000000");
	this.text.setAttribute('text-anchor', 'end');
	this.text.setAttribute('font-size', this.textFontSize + 'px');
	this.rect = document.createElementNS(xmlns, 'rect');
	this.rect.setAttribute('fill', this.options.color);
	this.rect.setAttribute('width', this.textFontSize / 2);
	this.rect.setAttribute('height', this.textFontSize / 2);

	// create marker element
	this.marker = document.createElementNS(xmlns, 'circle');
	this.marker.setAttribute('fill', '#ffffff');
	this.marker.setAttribute('stroke', '#d3d3d3');
	this.marker.setAttribute('r', this.markerSize / 2)
	// create background arc
	this.backgroundArc = document.createElementNS(xmlns, 'path');
	this.backgroundArc.setAttribute('fill', '#d3d3d3');
	this.hiddenBackgroundArc = document.createElementNS(xmlns, 'path');
	this.hiddenBackgroundArc.style.opacity = 0.0;
	// create foreground arc
	this.foregroundArc = document.createElementNS(xmlns, "path");
	this.foregroundArc.setAttribute('fill', this.options.color);
	this.foregroundArc.style.opacity = 0.6;

	this.options.container.appendChild(this.backgroundArc);
	this.options.container.appendChild(this.hiddenBackgroundArc);
	this.options.container.appendChild(this.foregroundArc);
	this.options.container.appendChild(this.marker);
	this.options.legendGroup.appendChild(this.rect);
	this.options.legendGroup.appendChild(this.text);

	// initial draw
	this.drawBackgroundArc();
	this.drawSlider(this.sliderStartAngleDiff, this.sliderStartAngleDiff);
	this.drawMarker(this.sliderStartAngleDiff)
	this.drawLegend();

	// register events
	var self = this;
	this.pressWrapper = function(event) {self.onPress(event);};
	this.releaseWrapper = function(event) {self.onRelease(event);};
	this.moveWrapper = function(event) {self.onMove(event);};

	this.foregroundArc.addEventListener('click', this.moveWrapper);
	this.foregroundArc.addEventListener('mousedown', this.pressWrapper);
	this.foregroundArc.addEventListener('touchstart', this.pressWrapper);

	this.hiddenBackgroundArc.addEventListener('click', this.moveWrapper);
	this.hiddenBackgroundArc.addEventListener('mousedown', this.pressWrapper);
	this.hiddenBackgroundArc.addEventListener('touchstart', this.pressWrapper);

	this.marker.addEventListener('click', this.moveWrapper);
	this.marker.addEventListener('mousedown', this.pressWrapper);
	this.marker.addEventListener('touchstart', this.pressWrapper);
}

Slider.prototype.drawLegend = function() {
	var textNumber = this.options.legendGroup.getElementsByTagName('text').length;
	var legendY = this.centerY / 2 + (1 + this.sliderId) * this.textFontSize;
	// set text
	this.text.setAttribute('x', this.legendWidth);
	this.text.setAttribute('y', legendY);
	this.text.textContent = this.currentValue;
	// set square
	this.rect.setAttribute('x', 10)
	this.rect.setAttribute('y', legendY - this.textFontSize / 2);
}

Slider.prototype.drawMarker = function(angle) {
	var markerCenter = Math.polarToCartesian(this.centerX, this.centerY, this.options.radius, angle);
	this.marker.setAttribute('cx', markerCenter.x);
	this.marker.setAttribute('cy', markerCenter.y);
}

Slider.prototype.drawSlider = function(startAngle, endAngle) {
	this.foregroundArc.setAttribute('d', this.buildArcDescription(startAngle, endAngle));
}

Slider.prototype.drawBackgroundArc = function() {
	var fullDescription = '';
	for(var i = this.sliderStartAngleDiff; i < 360 + this.sliderStartAngleDiff; i += this.angleStep) {
		var whiteAngleSpace = this.angleStep * 0.05;
		var startAngle = i + whiteAngleSpace;
		var endAngle   = i + this.angleStep - whiteAngleSpace;
		fullDescription += ' ' + this.buildArcDescription(startAngle, endAngle);
	}
	this.backgroundArc.setAttribute('d', fullDescription);
	this.hiddenBackgroundArc.setAttribute('d', this.buildArcDescription(this.sliderStartAngleDiff, 360 + this.sliderStartAngleDiff));
}

Slider.prototype.buildArcDescription = function(startAngle, endAngle) {
	// force close arc if end angle close to 360 + slider starting angle and end angle made full circle
	var maxAngleValue = this.sliderStartAngleDiff + 360;
	var forceClose = (endAngle % maxAngleValue === 0 || Math.abs(endAngle % maxAngleValue - maxAngleValue) < 1e-5) && Math.abs(endAngle / (360 + this.sliderStartAngleDiff)) > 0;
	endAngle = forceClose ? endAngle - 1 : endAngle;

	// outer arc params
	var outerRadius = this.options.radius + this.sliderWidth / 2;
	var outerArcStart = Math.polarToCartesian(this.centerX, this.centerY, outerRadius, startAngle);
	var outerArcEnd   = Math.polarToCartesian(this.centerX, this.centerY, outerRadius, endAngle);

	// inner arc params
	var innerRadius = this.options.radius - this.sliderWidth / 2;
	var innerArcStart = Math.polarToCartesian(this.centerX, this.centerY, innerRadius, startAngle);
	var innerArcEnd   = Math.polarToCartesian(this.centerX, this.centerY, innerRadius, endAngle);

	var largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
	var closingCommand = forceClose ? ['Z', 'M', innerArcEnd.x, innerArcEnd.y].join(' ') : ['L', innerArcEnd.x, innerArcEnd.y].join(' ');
	var description = [
		'M', outerArcStart.x, outerArcStart.y,
		'A', outerRadius, outerRadius, 0, largeArcFlag, 1, outerArcEnd.x, outerArcEnd.y,
		closingCommand,
		'A', innerRadius, innerRadius, 0, largeArcFlag, 0, innerArcStart.x, innerArcStart.y,
		'Z'
	].join(' ');

	return description
}

Slider.prototype.onPress = function(event) {
	this.sliderActive = true;

	window.addEventListener('mousemove', this.moveWrapper);
	window.addEventListener('touchmove', this.moveWrapper)
	window.addEventListener('mouseup', this.releaseWrapper);
	window.addEventListener('touchend', this.releaseWrapper);
}

Slider.prototype.onRelease = function(event) {
	this.sliderActive = false;

	window.removeEventListener('mousemove', this.moveWrapper);
	window.removeEventListener('touchmove', this.moveWrapper);
	window.removeEventListener('mouseup', this.releaseWrapper);
	window.removeEventListener('touchend', this.releaseWrapper);
}

Slider.prototype.onMove = function(event) {
	if(this.sliderActive || event.type === 'click') {
		var interactedPosition = this.getInteractedPosition(event);
		var x = interactedPosition.x - this.centerX;
		var y = interactedPosition.y - this.centerY;

		var angle = Math.radiansToDegrees(Math.atan2(y, x));
		angle = y < 0 ? angle + 360 : angle;

		// adjust angle for the offset 
		angle = this.sliderStartAngleDiff < 0 && angle > 360 + this.sliderStartAngleDiff ? angle = angle - 360 : angle;
		angle = this.sliderStartAngleDiff > 0 && angle < this.sliderStartAngleDiff ? angle = angle + 360 : angle;
		// set closest full step angle
		var stepNumber = Math.round((angle - this.sliderStartAngleDiff) / this.angleStep);
		angle = stepNumber * this.angleStep + this.sliderStartAngleDiff;

		this.drawSlider(this.sliderStartAngleDiff, angle);
		this.drawMarker(angle);

		// set new value of slider
		this.currentValue = this.options.minValue + stepNumber * this.options.step;
		this.drawLegend();
	}
}

Slider.prototype.getInteractedPosition = function(event) {
	return {
		x: !!event.touches ? event.touches[0].clientX - this.containerRect.left: event.clientX - this.containerRect.left,
		y: !!event.touches ? event.touches[0].clientY - this.containerRect.top: event.clientY - this.containerRect.top
	}
}

Math.radiansToDegrees = function(radians) {
  return radians * 180 / Math.PI;
}

Math.polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
	var angleInRadians = angleInDegrees * Math.PI / 180.0;
	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	};
}