var efforts = {};
var citiesData = {};

loadJsonOverAjax().done(executeDataDependencyFunction);

var categories = {
  'Energy': {
    'Solar Power': {
      'icon': 'icons/sun.png'
    }
  },
  'Infrastructure': {
    'Green Building': {
      'icon': 'icons/building.png'
    },
    'Green Infrastructure': {
      'icon': 'icons/tree.png'
    }
  },
  'Transportation': {
    'Street Car': {
      'icon': 'icons/ext.png'
    },
    'Bike share': {
      'icon': 'icons/bicycle.png'
    },
    'Light Rail': {
      'icon': 'icons/ext.png'
    },
    'Light rail extension': {
      'icon': 'icons/ext.png'
    }
  },
  'Urban Farm\/Forestry': {
    'Urban Garden': {
      'icon': 'icons/sunflower.png'
    }
  },
  'Urban Renewal': {
    'Vacant lot revitalization': {
      'icon': 'icons/lot.png'
    }
  },
  'Waste Recycling': {
    'Compost': {
      'icon': 'icons/compost.png'
    },
    'Biofuel': {
      'icon': 'icons/biofuel.png'
    }
  }
};

var subCategoriesCache = {};
$.each(categories, function(index, subCategories) {
  $.each(subCategories, function(subIndex, subcategory) {
    subCategoriesCache[subIndex] = subcategory;
  });
});

var styleAppliedFeaturesCache = [];
var mapDiv = document.getElementById('map');
var defaultCity = 'All';
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
  crossOrigin: 'anonymous',
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

/**
 * Elements that make up the popup.
 */
var popUpContainer = document.getElementById('popup');
var popUpContent = document.getElementById('popup-content');
var popUpCloser = document.getElementById('popup-closer');

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
popUpCloser.onclick = function() {
  overlay.setPosition(undefined);
  popUpCloser.blur();
  return false;
};

/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new ol.Overlay( /** @type {olx.OverlayOptions} */ ({
  element: popUpContainer,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
}));

//create basemap with layers,controls,interactions
var map = new ol.Map({
  target: mapDiv,
  renderer: 'canvas',
  controls: controls,
  overlays: [overlay],
  view: view
});


function emptyVectorlayer(name, style) {
  return new ol.layer.Vector({
    source: new ol.source.Vector({
      wrapX: true
    }),
    style: style,
    visible: true,
    crossOrigin: 'anonymous',
    name: name
  });
}



function getPopUpContent(feature) {
  var content = '<div class="feature-information">';
  content += '<h4><b>' + getTitleMarkUp(feature) + '</b></h4>' + '<p>' + getBuildingMarkUp(feature) + '</p>' + '<p>' + getLocationMarkUp(feature) + '</p>' + '<p>' + getDescriptionMarkUp(feature) + '</p>' + '<p>' + getURLMarkUp(feature) + '</p><br>';
  content += '</div>';
  return content;
}

function getTitleMarkUp(feature) {
  var title = getTitle(feature);
  if (title) {
    return '<div class="title">' + title + '</div>';
  } else {
    return '';
  }
}

function getURLMarkUp(feature) {
  var url = getURL(feature);
  if (url) {
    return '<a target="_blank" href="' + url + '"><input type="button" class="btn-primary" value="Read More" /></a>';
    //return url;
  } else {
    return '';
  }
}

function getDescriptionMarkUp(feature) {
  var description = getDescription(feature);
  if (description) {
    return '<div class="description">' + description + '</div>';
  } else {
    return '';
  }
}

function getBuildingMarkUp(feature) {
  var building = getBuilding(feature);
  if (building) {
    return '<div class="building">' + building + '</div>';
  } else {
    return '';
  }
}

function getLocationMarkUp(feature) {
  var location = getLocation(feature);
  if (location) {
    return '<div class="location">' + location + '</div>';
  } else {
    return '';
  }
}


function getTitle(feature) {
  return feature.getProperties().Initiative;
}

function getBuilding(feature) {
  return feature.getProperties().Building;
}

function getLocation(feature) {
  return feature.getProperties().Location;
}

function getDescription(feature) {
  return feature.getProperties().Describe;
}

function getURL(feature) {
  return feature.getProperties().URL_1;
}




function loadJsonOverAjax() {
  var a = $.Deferred();
  var b = $.Deferred();

  $.getJSON('GeoJSON/cities.geojson', function(geojsonObject) {
    var format = new ol.format.GeoJSON();
    var allCities = format.readFeatures(geojsonObject);
    $.each(allCities, function(index, feature) {
      var city = feature.getProperties().NAME;
      if (citiesData[city]) {
        citiesData[city].layer.getSource().addFeature(feature);
      } else {
        citiesData[city] = {
          'layer': emptyVectorlayer(city, regionStyle)
        };
        citiesData[city].layer.getSource().addFeature(feature);
      }
    });
    a.resolve();
  });

  $.getJSON('GeoJSON/AllEfforts.geojson', function(geojsonObject) {
    var format = new ol.format.GeoJSON();
    var allEfforts = format.readFeatures(geojsonObject);
    $.each(allEfforts, function(index, feature) {
      var city = feature.getProperties().City;
      if (efforts[city]) {
        efforts[city].layer.getSource().addFeature(feature);
      } else {
        efforts[city] = {
          'layer': emptyVectorlayer(city + 'Efforts', styleFunction)
        };
        efforts[city].layer.getSource().addFeature(feature);
      }
    });
    b.resolve();
  });

  return $.Deferred(function(def) {
    $.when(a, b).done(function() {
      def.resolve();
    });
  });
};


function executeDataDependencyFunction() {
  // Handle the user selection
  var handleCheckBoxOnClick = function() {
    var layers = map.getLayers();
    var $selectedCities = $('input[name="layers"]:not("#All"):checkbox:checked');
    $.each(efforts, function() {
      this.layer.setVisible(false);
    });

    $selectedCities.map(function() {
      efforts[this.value].layer.setVisible(true);
    });
  };
  // Handle the user selection
  var handleCategoriesCheckBoxOnClick = function() {
    var layerName = defaultCity;
    var layers = map.getLayers();

    $.each(styleAppliedFeaturesCache, function() {
      this.setStyle(getFeatureStyleonZoom(this));
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
      'class': 'sustainable-map-categories ol-control'
    });


    var categoriesDiv = $.parseHTML('<a href="#" class="toggle-category">Select Category</a><div id="toggle-category-marker" class="toggle-category-marker"><a href="#" class="toggle-category-marker-closer"></a></div><div class="categoryListRadio"><dl class="categoryList"></dl></div>');

    var dtTag = $(categoriesDiv).find('.categoryList');
    $.each(categories, function(index, category) {
      var checked = 'checked="checked"';
      var dlTag = $('<dd>').text(index);
      var subDtTag = $($.parseHTML('<div><dl class="subCategoryList"></dl></div>')).find('.subCategoryList');
      $.each(category, function(subIndex, subCategory) {
        var subDlTag = $('<dd>').html('<label for="' + subIndex + '">&nbsp;<input type="checkbox" id="' + subIndex + '" name="categoriesCheckBox" value="' + subIndex + '" ' + checked + '" >&nbsp;<img src="' + subCategory.icon + '" class="img-responsive sub-category-list-icon">&nbsp;' + subIndex + '</label>');
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


  map.addLayer(baseLayer);
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

  var resetMap = function() {
    map.getView().setCenter(center);
    map.getView().setZoom(zoom);
    $.each($('input[name="layers"]:checkbox'), function() {
      this.checked = true;
    });
    var layers = map.getLayers();
    for (var i = 0; i < layers.getLength(); i++) {
      layers.item(i).setVisible(true);
    }
    $.each(styleAppliedFeaturesCache, function(index, feature) {
      feature.setStyle(null);
    });
    styleAppliedFeaturesCache = [];
    $('.sustainable-map-categories').hide();
    $('.sustainable-map-cities').show();

    overlay.setPosition(undefined);
    popUpCloser.blur();

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

  map.on('singleclick', function(evt) {
    var informationContent = '';
    var overlayCoordinate = evt.coordinate;
    var foundEffort=false;
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {

      if (feature) {
        var properties = feature.getProperties();

        if (!properties.NAME && properties.City) { //If feature is from effort layer
          informationContent = informationContent + getPopUpContent(feature);
          foundEffort=true;
        }

        if (foundEffort==false && properties.NAME) { //If feature is from city region layer
          var effortsLayer = efforts[properties.NAME];
          var features = effortsLayer.layer.getSource().getFeatures();
          $.each(features, function() {
            this.setStyle(getFeatureStyleonZoom(this));
            styleAppliedFeaturesCache.push(this);
          });
          $('input[name="layers"][value="' + properties.NAME + '"]:not("#All"):checkbox').checked = true;

          map.getView().fit(
            layer.getSource().getExtent(),
            map.getSize(), {
              padding: [30, 30, 30, 30],
              constrainResolution: false
            }
          );
          $('.sustainable-map-categories').show();
          $('.sustainable-map-cities').hide();

        }

      } else {
        resetMap();
      }

    });
  if (informationContent != '') {
      popUpContent.innerHTML = informationContent;
      overlay.setPosition(overlayCoordinate);

    } else {
      overlay.setPosition(undefined);
      popUpCloser.blur();
    }
  });


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
      'class': 'sustainable-map-cities ol-control'
    });

    var cities = '<a href="#" class="toggle-city">Select City</a><div id="toggle-city-marker" class="toggle-city-marker"><a href="#" class="toggle-city-marker-closer"></a></div><div class="cityListRadio"><dl class="cityList"><dt ></dt></dl></div>';

    var citiesDiv = $.parseHTML(cities);

    var dtTag = $(citiesDiv).find('.cityList');
    var checked = 'checked="checked"';
    var dlAllTag = $('<dd>').html('<label for="All"><input type="checkbox" id="All" name="layers" value="All" ' + checked + ' >&nbsp;&nbsp; All</label>');

    $(dlAllTag).find('#All').on('change', function(event) {
      if (this.checked) {
        $('input[name="layers"]:not("#All"):checkbox').each(function() {
          this.checked = true;
        });
      } else {
        $('input[name="layers"]:not("#All"):checkbox').each(function() {
          this.checked = false;
        });
      }
    });

    $(dtTag).append(dlAllTag);

    $.each(efforts, function(index, layer) {

      dlTag = $('<dd>').html('<label for="' + index + '"><input type="checkbox" id="' + index + '" name="layers" value="' + index + '" ' + checked + ' >&nbsp;&nbsp;' + index + '</label>');

      $(dlTag).find('#' + index).on('change', function(event) {

        if ($('input[name="layers"]:not("#All"):checkbox').length == $('input[name="layers"]:not("#All"):checkbox:checked').length) {
          $(dtTag).find('#All')[0].checked = true;
        } else {
          $(dtTag).find('#All')[0].checked = false;
        }
      });

      $(dtTag).append(dlTag);
    });


    $(controller).append(citiesDiv);

    $(controller).on('change', handleCheckBoxOnClick);

    ol.control.Control.call(this, {
      element: controller,
      target: options.target
    });


  };
  ol.inherits(FeatureController, ol.control.Control);

  var featureController = new FeatureController();


  $.each(citiesData, function() {
    map.addLayer(this.layer);
  });

  $.each(efforts, function() {
    map.addLayer(this.layer);
  });


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

  map.addControl(categoryFeatureController);
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

  $('.sustainable-map-categories').hide();


}

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

function regionStyle(feature, resolution) {
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
    opacity: 1,
    scale: 1,
    src: imageUri
  }));
}


function getFeatureStyleonZoom(feature) {
  var properties = feature.getProperties();

  if (properties.Initiative in subCategoriesCache && $('input[id="' + properties.Initiative + '"]:checkbox:checked').length == 1) {
    var subCategory = subCategoriesCache[properties.Initiative];
    var geometry = feature.getGeometry();
    if (properties.Initiative == 'Light rail extension') {
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'blue',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'blue'
        })
      })];
    }
    if (properties.Initiative == 'Light Rail' || properties.Initiative == 'Street Car') {
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'yellow',
          width: 2
        }),
        fill: new ol.style.Fill({
          color: 'yellow'
        })
      })];
    }
    return [getMarkerIconStyle(subCategory.icon)];
  } else {
    return null
  }
}

function getMarkerIconStyle(uri) {
  return new ol.style.Style({
    image: iconStyle(uri)
  });
}

function styleFunction(feature, resolution) {
  var featureStyleFunction = feature.getStyleFunction();
  if (featureStyleFunction) {
    return featureStyleFunction.call(feature, resolution);
  } else {
    return getStyle(feature, resolution);
  }
};

function isEffortsLayer(layer) {
  var layerName = layer.get('name');
  if (layerName.indexOf('Efforts') > -1) {
    return true;
  }
  return false;
}
