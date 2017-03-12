var Options = function (container, color, minValue, maxValue, step, radius) {
	this.container = container;
	this.color     = color;
	this.minValue  = minValue;
	this.maxValue  = maxValue;
	this.step      = step;
	this.radius    = radius;

	this.legendGroup = container.getElementsByTagName('g')[0];
	if(!this.legendGroup) {
		this.legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.container.appendChild(this.legendGroup);
	}
}