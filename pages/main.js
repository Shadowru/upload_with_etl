import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {Tile as TileLayer} from 'ol/layer';
import {OSM} from 'ol/source';
import {fromLonLat} from 'ol/proj'

var style = new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.6)',
    }),
    stroke: new Stroke({
        color: '#319FD3',
        width: 1,
    }),
    text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
            color: '#000',
        }),
        stroke: new Stroke({
            color: '#fff',
            width: 3,
        }),
    }),
});

var vectorLayer = new VectorLayer({
    source: new VectorSource({
        url: 'convert.json',
        format: new GeoJSON(),
    }),
    style: function (feature) {
        style.getText().setText(feature.get('name'));
        return style;
    },
});

const coords = fromLonLat([37.618423, 55.751244])

console.log('coords : ' + coords)


var view = new View({
    center: coords,
    zoom: 14,
});

var map = new Map({
    layers: [
        new TileLayer({
            source: new OSM(),
        }),
        vectorLayer
    ],
    target: 'map',
    view: view
});

var highlightStyle = new Style({
    stroke: new Stroke({
        color: '#f00',
        width: 1,
    }),
    fill: new Fill({
        color: 'rgba(255,0,0,0.1)',
    }),
    text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
            color: '#000',
        }),
        stroke: new Stroke({
            color: '#f00',
            width: 3,
        }),
    }),
});

var featureOverlay = new VectorLayer({
    source: new VectorSource(),
    map: map,
    style: function (feature) {
        highlightStyle.getText().setText(feature.get('name'));
        return highlightStyle;
    },
});

var highlight;
var displayFeatureInfo = function (pixel) {
    vectorLayer.getFeatures(pixel).then(function (features) {
        var feature = features.length ? features[0] : undefined;
        var info = document.getElementById('info');
        if (features.length) {
            const attributes = feature.get('Attributes');
            info.innerHTML = attributes.WorksPlace + ' ' + attributes.WorksType + ': ' + attributes.WorksBeginDate + ' - ' + attributes.WorksEndDate + ' [' + attributes.global_id  + '][' + feature.get('converter') + ']';
        } else {
            info.innerHTML = '&nbsp;';
        }

        if (feature !== highlight) {
            if (highlight) {
                featureOverlay.getSource().removeFeature(highlight);
            }
            if (feature) {
                featureOverlay.getSource().addFeature(feature);
            }
            highlight = feature;
        }
    });
};

map.on('pointermove', function (evt) {
    if (evt.dragging) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    displayFeatureInfo(pixel);
});

map.on('click', function (evt) {
    displayFeatureInfo(evt.pixel);
});

