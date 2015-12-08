var efforts = {
  'AllEfforts': {
    'name': 'All',
    'uri': 'GeoJSON/AllEfforts.geojson',
    'count': 0,
    'styleCache': {}
  },
  'MesaEfforts': {
    'name': 'Mesa',
    'uri': 'GeoJSON/MesaEfforts.geojson',
    'count': 0,
    'styleCache': {}
  },
  'PhoenixEfforts': {
    'name': 'Phoenix',
    'uri': 'GeoJSON/PhoenixEfforts.geojson',
    'count': 0,
    'styleCache': {}
  },
  'TempeEfforts': {
    'name': 'Tempe',
    'uri': 'GeoJSON/TempeEfforts.geojson',
    'count': 0,
    'styleCache': {}
  }
};

var cities = {
  'Mesa': {
    'name': 'Mesa',
    'uri': 'GeoJSON/Mesa3857.geojson',
    'count': 0,
    'styleCache': {}
  },
  'Phoenix': {
    'name': 'Phoenix',
    'uri': 'GeoJSON/Phoenix3857.geojson',
    'count': 0,
    'styleCache': {}
  },
  'Tempe': {
    'name': 'Tempe',
    'uri': 'GeoJSON/Tempe3857.geojson',
    'count': 0,
    'styleCache': {}
  }
};


var categories = {
  'Energy': {
    'Solar Power': {
      'icon': 'Icons/Sun.png'
    }
  },
  'Infrastructure': {
    'Green Building': {
      'icon': 'Icons/Building1.png'
    },
    'Green Infrastructure': {
      'icon': 'Icons/tree.png'
    }
  },
  'Transportation': {
    'Street Car': {
      'icon': 'Icons/Ext.png"'
    },
    'Bike share': {
      'icon': 'Icons/Bicycle.png'
    },
    'Light rail extension': {
      'icon': 'Icons/Ext.png'
    }
  },
  'Urban Farm\/Forestry': {
    'Urban Garden': {
      'icon': 'Icons/Sunflower.png'
    }
  },
  'Urban Renewal': {
    'Vacant lot revitalization': {
      'icon': 'Icons/LotIcon.png'
    }
  },
  'Waste Recycling': {
    'Compost': {
      'icon': 'Icons/CompostIcon.png'
    },
    'Biofuel': {
      'icon': 'Icons/Biofuel.png'
    }
  }
};

var subCategoriesCache = {};
$.each(categories, function(index, subCategories) {
  $.each(subCategories, function(subIndex, subcategory) {
    subCategoriesCache[subIndex] = subcategory;
  });
});

console.log(subCategoriesCache);
var styleAppliedFeaturesCache = [];
var mapDiv = document.getElementById('map');
var defaultCity = 'AllEfforts';
var defaultCategory = 'AllEfforts';
var zoom = 10.6;
var minZoom = zoom;
var maxZoom = minZoom + 18;
var clusterDistance = 50;
var geoJson = new ol.format.GeoJSON();
var baseLayerURL = 'https://b.tiles.mapbox.com/v4/github.kedo1cp3/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2hhc2V0aGVuYWc0MjAiLCJhIjoiY2lnNDhibThiMmZ2a3YzbTNza283dDd4cyJ9.UGgEZnwV7A5PQl5TZ2lV_Q';
var attribution = '© <a href="https://www.mapbox.com/map-feedback/"">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
var baseLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: baseLayerURL,
    attributions: [new ol.Attribution({
      html: attribution
    })]
  }),
  crossOrigin: null,
  name: 'base'
});

//Create controls for the map
var controls = ol.control.defaults({
  attributionOptions: ({
    collapsible: false
  })
});

// Create a view and set the center position
var center = [-12460275.74916, 3975561.97282];
var view = new ol.View({
  // the view's initial state
  center: center,
  zoom: zoom,
  minZoom: minZoom,
  maxZoom: maxZoom
});


//create basemap with layers,controls,interactions
var map = new ol.Map({
  target: mapDiv,
  renderer: 'canvas',
  controls: controls,
  view: view
});

// Handle the user selection
var handleCheckBoxOnClick = function() {
  var layerName = defaultCity;
  var layers = map.getLayers();
  var $selectedCities = $('input[name="layers"]:checkbox:checked');
  if ($selectedCities.length > 0) {
    for (var i = 0; i < layers.getLength(); i++) {
      if (isEffortsLayer(layers.item(i))) {
        layers.item(i).setVisible(false);
      }
    }
  }

  $selectedCities.map(function(index, element) {

    if (element.value !== undefined) {
      layerName = element.value;
    }
    setLayerToVisibe(layerName);
  });
};


/**
 * To add controls to the map on click checkbox
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} optOptions Control options.
 */
var FeatureController = function(optOptions) {

  var options = optOptions || {};
  var controller = document.createElement('div');

  $(controller).attr({
    'class': 'research-map-cities ol-control'
  });

  var cities = '<a href="#" class="toggle-city">Select City</a><div id="toggle-city-marker" class="toggle-city-marker"><a href="#" class="toggle-city-marker-closer"></a></div><div class="cityListRadio"><dl class="cityList"><dt ></dt></dl></div>';

  var citiesDiv = $.parseHTML(cities);

  var dtTag = $(citiesDiv).find('.cityList');
  $.each(efforts, function(index, effort) {
    var checked = '';
    if (index === defaultCity) {
      checked = 'checked="checked"';
    }
    var dlTag = $('<dd>').html('<label for="' + index + '"><input type="checkbox" id="' + index + '" name="layers" value="' + index + '" ' + checked + '" >&nbsp;&nbsp;' + effort.name + '</label>');
    $(dtTag).append(dlTag);
  });
  $(controller).append(citiesDiv);

  //controller.addEventListener('click', handleCheckBoxOnClick);
  $(controller).on('change', handleCheckBoxOnClick);

  ol.control.Control.call(this, {
    element: controller,
    target: options.target
  });

};
ol.inherits(FeatureController, ol.control.Control);

var featureController = new FeatureController();

// Handle the user selection
var handleCategoriesCheckBoxOnClick = function() {
  var layerName = defaultCategory;
  var layers = map.getLayers();

  $.each(styleAppliedFeaturesCache, function(index, feature) {
    var featureStyle = getFeatureStyle(feature);
    if (featureStyle == null) {
      feature.setStyle(null);
    } else {
      feature.setStyle([featureStyle]);
    }
  });
};


/**
 * To add controls to the map on click checkbox
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} optOptions Control options.
 */
var CategoryFeatureController = function(optOptions) {

  var options = optOptions || {};
  var controller = document.createElement('div');

  $(controller).attr({
    'class': 'research-map-categories ol-control'
  });


  var categoriesDiv = $.parseHTML('<a href="#" class="toggle-category">Select Category</a><div id="toggle-category-marker" class="toggle-category-marker"><a href="#" class="toggle-category-marker-closer"></a></div><div class="categoryListRadio"><dl class="categoryList"></dl></div>');

  var dtTag = $(categoriesDiv).find('.categoryList');
  $.each(categories, function(index, category) {
    var checked = 'checked="checked"';
    var dlTag = $('<dd>').text(index);
    var subDtTag = $($.parseHTML('<div><dl class="subCategoryList"></dl></div>')).find('.subCategoryList');
    $.each(category, function(subIndex, subCategory) {
      var subDlTag = $('<dd>').html('<label for="' + subIndex + '"><input type="checkbox" id="' + subIndex + '" name="categoriesCheckBox" value="' + subIndex + '" ' + checked + '" >&nbsp;&nbsp;' + subIndex + '</label>');
      $(subDtTag).append(subDlTag);
    });
    dlTag.append(subDtTag);
    $(dtTag).append(dlTag);
  });
  $(controller).append(categoriesDiv);

  //controller.addEventListener('click', handleCheckBoxOnClick);
  $(controller).on('change', handleCategoriesCheckBoxOnClick);

  ol.control.Control.call(this, {
    element: controller,
    target: options.target
  });

};
ol.inherits(CategoryFeatureController, ol.control.Control);

var categoryFeatureController = new CategoryFeatureController();
var vectorSource = function(url) {
  return new ol.source.Vector({
    url: url,
    format: geoJson,
    wrapX: false
  });
};

var clusterSource = function(url) {
  return new ol.source.Cluster({
    distance: clusterDistance,
    source: vectorSource(url),
    wrapX: false
  });
};

var styleFunction = function(feature, resolution) {
  var featureStyleFunction = feature.getStyleFunction();
  if (featureStyleFunction) {
    return featureStyleFunction.call(feature, resolution);
  } else {
    return getStyle(feature, resolution);
  }
};

map.addLayer(baseLayer);

$.each(cities, function(index, city) {
  var uri = city.uri;
  var pointSource = vectorSource(uri);
  var vectorPointLayer = new ol.layer.Vector({
    source: pointSource,
    style: groupStyle,
    visible: true,
    crossOrigin: null,
    name: index
  });
  map.addLayer(vectorPointLayer);
});


$.each(efforts, function(index, effort) {
  var uri = effort.uri;
  var pointSource = vectorSource(uri);
  var vectorPointLayer = new ol.layer.Vector({
    source: pointSource,
    style: styleFunction,
    visible: true,
    crossOrigin: null,
    name: index
  });
  map.addLayer(vectorPointLayer);
});



// display total on pointermove
map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  // changes mouse cursor to pointer while over marker
  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);
  map.getTarget().style.cursor = hit ? 'pointer' : '';
});




function isRegionLayer(layer) {
  var layerName = layer.get('name');
  var city = layerName.substr(0, layerName.length - 7)
  if (city in cities) {
    return true;
  }
  return false;
}

function isEffortsLayer(layer) {
  var layerName = layer.get('name');
  if (layerName.indexOf('Efforts') > -1) {
    return true;
  }
  return false;
}

function setLayerToVisibe(layerName) {
  var layers = map.getLayers();
  for (var i = 0; i < layers.getLength(); i++) {
    if (layers.item(i).get('name') === layerName) {
      layers.item(i).setVisible(true);
    }
  }
}



map.addControl(featureController);

$('.cityListRadio').hide();
$('.toggle-city-marker-closer').toggleClass('lower');
$('.toggle-city-marker').on('click', function() {
  $('.cityListRadio').toggle('slow');
  $('.toggle-city-marker-closer').toggleClass('lower');
});

$('.toggle-city').on('click', function() {
  $('.cityListRadio').toggle('slow');
  $('.toggle-city-marker-closer').toggleClass('lower');
});





$('.categoryListRadio').hide();
$('.toggle-category-marker-closer').toggleClass('lower');
$('.toggle-category-marker').on('click', function() {
  $('.categoryListRadio').toggle('slow');
  $('.toggle-category-marker-closer').toggleClass('lower');
});

$('.toggle-category').on('click', function() {
  $('.categoryListRadio').toggle('slow');
  $('.toggle-category-marker-closer').toggleClass('lower');
});

var resetMap = function() {
  map.getView().setCenter(center);
  map.getView().setZoom(zoom);
  var $checkbox = $('input[name="layers"]:checkbox');
  $checkbox.map(function(index, element) {

    if (element.value === 'AllEfforts') {
      element.checked = 'checked';
    } else {
      element.checked = undefined;
    }
  });
  var layers = map.getLayers();
  for (var i = 0; i < layers.getLength(); i++) {
    layers.item(i).setVisible(true);
  }
  $.each(styleAppliedFeaturesCache, function(index, feature) {
    feature.setStyle(null);
  });
  styleAppliedFeaturesCache = [];
  map.removeControl(categoryFeatureController);
  map.addControl(featureController);
};


var ResetMapControl = function(optOptions) {

  var options = optOptions || {};

  var button = document.createElement('button');
  button.innerHTML = 'R';

  button.addEventListener('click', resetMap, false);
  button.addEventListener('touchstart', resetMap, false);

  var element = document.createElement('div');
  element.className = 'reset-map ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(ResetMapControl, ol.control.Control);
map.addControl(new ResetMapControl());

// display info on click
map.on('singleclick', function(evt) {
  var feature = map.forEachFeatureAtPixel(evt.pixel,
    function(feature, layer) {
      return feature;
    });

  if (feature) {
    if (feature.getGeometry() instanceof ol.geom.Point) {

    } else {
      var properties = feature.getProperties();
      var clickedEffortsLayer = properties.NAME + 'Efforts';
      var layers = map.getLayers();
      var size = (map.getSize());
      var clickedEffortsLayerExtent;
      var $selectedCities = $('input[name="layers"]:checkbox');
      for (var i = 0; i < layers.getLength(); i++) {
        var currentLayerName = layers.item(i).get('name');
        if (currentLayerName !== 'base') {
          if (currentLayerName === clickedEffortsLayer) {
            layers.item(i).setVisible(true);
            var features = layers.item(i).getSource().getFeatures();
            $.each(features, function(index, feature) {
              var featureStyle = getFeatureStyle(feature);
              if (featureStyle == null) {
                feature.setStyle(null);
              } else {
                feature.setStyle([featureStyle]);
              }
              styleAppliedFeaturesCache.push(feature);
            });

            $selectedCities.map(function(index, element) {

              if (element.value === clickedEffortsLayer) {
                element.checked = 'checked';
              } else {
                element.checked = undefined;
              }
            });
          } else if (properties.NAME === currentLayerName) {
            layers.item(i).setVisible(true);
            clickedEffortsLayerExtent = layers.item(i).getSource().getExtent();
            map.getView().fit(
              clickedEffortsLayerExtent,
              size, {
                padding: [30, 30, 30, 30],
                constrainResolution: false
              }
            );
            map.getView().setCenter(ol.extent.getCenter(clickedEffortsLayerExtent));
            map.removeControl(featureController);
            map.addControl(categoryFeatureController);
          } else {
            layers.item(i).setVisible(false);
          }
        }
      }
    }

  } else {
    resetMap();
  }

});

function getStyle(feature, resolution) {

  return [new ol.style.Style({
    image: new ol.style.Circle({
      radius: 2,
      stroke: new ol.style.Stroke({
        color: 'rgba(255,0,0,0.8)',
        width: 5
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.8)'
      })
    })
  })];
}

function groupStyle(feature, resolution) {
  var properties = feature.getProperties();
  return [new ol.style.Style({
    fill: new ol.style.Fill({
      color: properties.color !== undefined ? properties.color : 'rgba(0,255,255,0.5)'
    }),
    stroke: new ol.style.Stroke({
      color: properties.strokeColor !== undefined ? properties.strokeColor : 'rgba(0,0,0,0.5)',
      width: 1
    })
  })];
}


// style the marker icon to be displayed
function iconStyle(imageUri) {
  return new ol.style.Icon(({
    anchor: [0.5, 20],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    scale: 0.6,
    src: imageUri
  }));
}


function getFeatureStyle(feature) {
  var properties = feature.getProperties();

  var categoryCheckbox = $('input[id="' + properties.Initiative + '"]:checkbox:checked');
  console.log(properties.Initiative);
  if (properties.Initiative in subCategoriesCache && categoryCheckbox.length == 1) {
    var subCategory = subCategoriesCache[properties.Initiative];
    return getMarkerIconStyle(subCategory.icon);
  }  else {
    return null
  }
}

function getMarkerIconStyle(uri) {
  return new ol.style.Style({
    image: iconStyle(uri)
  });
}
