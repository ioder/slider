var Slider = function(options) {
	if ((options.maxValue - options.minValue) % options.step !== 0) 
		throw 'Invalid step size!';
	if ((options.maxValue - options.minValue) <= 0) 
		throw 'Max value smaller than min value!';

	this.options = options;
	this.init();
}

Slider.prototype.init = function() {
	var xmlns = "http://www.w3.org/2000/svg";
	this.sliderWidth = 10;
	this.sliderStartAngleDiff = -90;

	this.sliderActive = false;
	this.currentValue = this.options.minValue;

	this.containerRect = this.options.container.getBoundingClientRect();
	this.centerX = this.containerRect.width / 2;
	this.centerY = this.containerRect.height / 2;

	this.angleStep = 360 / Math.floor((this.options.maxValue - this.options.minValue) / this.options.step);

	// create text element
	this.textNode = document.createElementNS(xmlns, "text");
	// create background arc
	this.backgroundArc = document.createElementNS(xmlns, "path");
	this.backgroundArc.setAttributeNS(null, 'fill', '#d3d3d3');
	this.backgroundArc.setAttributeNS(null, 'stroke', '#d3d3d3');
	// create foreground arc
	this.foregroundArc = document.createElementNS(xmlns, "path");
	this.foregroundArc.setAttributeNS(null, 'fill', this.options.color);
	this.foregroundArc.setAttributeNS(null, 'stroke', this.options.color);

	this.options.container.appendChild(this.backgroundArc);
	this.options.container.appendChild(this.foregroundArc);

	this.drawBackgroundArc();
	this.drawSlider(this.sliderStartAngleDiff, this.sliderStartAngleDiff+10);

	// register events
	var self = this;
	this.foregroundArc.addEventListener('mousedown', function(event) {self.onPress(event);});
	this.foregroundArc.addEventListener('mouseup', function(event) {self.onRelease(event);});
	this.foregroundArc.addEventListener('mousemove', function(event) {self.onMove(event);});
	this.backgroundArc.addEventListener('mousedown', function(event) {self.onPress(event);});
	this.backgroundArc.addEventListener('mouseup', function(event) {self.onRelease(event);});
	this.backgroundArc.addEventListener('mousemove', function(event) {self.onMove(event);});
	

	//this.foregroundArc.addEventListener('touchstart', function(event) {self.onPress(event);});
	//this.foregroundArc.addEventListener('touchend', function(event) {self.onRelease(event);});
	//this.foregroundArc.addEventListener('touchmove', function(event) {self.onMove(event);});
}

Slider.prototype.drawSlider = function(startAngle, endAngle) {
	this.foregroundArc.setAttribute("d", this.buildArcDescription(startAngle, endAngle));
}

Slider.prototype.drawBackgroundArc = function() {
	var fullDescription = '';
	for(var i = this.sliderStartAngleDiff; i < 360 + this.sliderStartAngleDiff; i += this.angleStep) {
		var whiteAngleSpace = this.angleStep * 0.05;
		var startAngle = i + whiteAngleSpace;
		var endAngle   = i + this.angleStep - whiteAngleSpace;
		fullDescription += ' ' + this.buildArcDescription(startAngle, endAngle);
	}
	this.backgroundArc.setAttribute("d", fullDescription);
}

Slider.prototype.buildArcDescription = function(startAngle, endAngle) {
	// outer arc params
	var outerRadius = this.options.radius + this.sliderWidth / 2;
	var outerArcStart = Math.polarToCartesian(this.centerX, this.centerY, outerRadius, startAngle);
	var outerArcEnd   = Math.polarToCartesian(this.centerX, this.centerY, outerRadius, endAngle);

	// inner arc params
	var innerRadius = this.options.radius - this.sliderWidth / 2;
	var innerArcStart = Math.polarToCartesian(this.centerX, this.centerY, innerRadius, startAngle);
	var innerArcEnd   = Math.polarToCartesian(this.centerX, this.centerY, innerRadius, endAngle);

	var largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
	var description = [
		"M", innerArcStart.x, innerArcStart.y,
		"L", outerArcStart.x, outerArcStart.y,
		"A", outerRadius, outerRadius, 0, largeArcFlag, 1, outerArcEnd.x, outerArcEnd.y,
		"L", innerArcEnd.x, innerArcEnd.y,
		"A", innerRadius, innerRadius, 0, largeArcFlag, 0, innerArcStart.x, innerArcStart.y,
	].join(" ");

	return description
}

Slider.prototype.onPress = function(event) {
	this.sliderActive = true;
}

Slider.prototype.onRelease = function(event) {
	this.sliderActive = false;
}

Slider.prototype.onMove = function(event) {
	if(this.sliderActive) {
		var interactedPosition = this.getInteractedPosition(event);
		//console.log(interactedPosition)
		var x = interactedPosition.x - this.centerX;
		var y = interactedPosition.y - this.centerY;

		var angle = Math.radiansToDegrees(Math.atan2(y, x));
		angle = y < 0 ? angle + 360 : angle;
		angle = this.sliderStartAngleDiff < 0 && angle > 360 + this.sliderStartAngleDiff ? angle = angle - 360 : angle;
		angle = this.sliderStartAngleDiff > 0 && angle < this.sliderStartAngleDiff ? angle = angle + 360 : angle;
		
		console.log(this.sliderStartAngleDiff, angle)
		this.drawSlider(this.sliderStartAngleDiff, angle);
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