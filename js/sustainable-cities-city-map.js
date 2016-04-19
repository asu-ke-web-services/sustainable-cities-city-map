var efforts = {};
var cityBoundaries = {};
var categories = {};
loadJsonOverAjax().done(executeDataDependencyFunction);

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

function getCityLabelFeature( label, cords ) {
  var style = [new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: '#319FD3',
      width: 1
    }),
    text: new ol.style.Text({
      font: '18px Calibri,sans-serif',
      fill: new ol.style.Fill({
        color: '#000'
      }),
      text: label,
      stroke: new ol.style.Stroke({
        color: '#fff',
        width: 3
      })
    })
  })];

  labelFeature = new ol.Feature({
    name: label,
    geometry: new ol.geom.Point( cords )
  });

  labelFeature.setStyle(style);
  return labelFeature;
}

function loadJsonOverAjax() {
  var a = $.Deferred();
  var b = $.Deferred();

  $.getJSON('GeoJSON/cities.geojson', function(geojsonObject) {
    var format = new ol.format.GeoJSON();
    var allCities = format.readFeatures(geojsonObject);
    $.each(allCities, function(index, feature) {
      var city = feature.getProperties().NAME;
      if (!cityBoundaries[city]) {
        cityBoundaries[city] = {
          'layer': emptyVectorlayer(city, regionStyle)
        };
        // Add a new dummy feature to display City name

        var labelFeature = getCityLabelFeature(
          feature.getProperties().NAME,
          ol.extent.getCenter( feature.getGeometry().getExtent() )
        );
        cityBoundaries[city].layer.getSource().addFeature( labelFeature );
      }
      cityBoundaries[city].layer.getSource().addFeature(feature);
    });
    a.resolve();
  });

  $.getJSON('GeoJSON/AllEfforts.geojson', function(geojsonObject) {
    var format = new ol.format.GeoJSON();
    var allEfforts = format.readFeatures(geojsonObject);
    $.each(allEfforts, function(index, feature) {

      addFeature(efforts, feature);
    });
    b.resolve();
  });

  $.getJSON('GeoJSON/Reports.json', function(reports) {
    $.each(reports, function(index, report) {
      $.each(report, function(cityIndex, cityData) {
        var city = cityData.city;
        var initiatives = cityData.initiatives;
        var header = $('<h4>').text( city + ' Plans/Reports');
        var reportsDiv=$('<div class="table-reponsive">');
        var table= $('<table class="table table-bordered">');
        $.each(initiatives, function(intiativeIndex, initiative) {
          var icon = initiative.icon;
          var data = initiative.data;
          var tr=$('<tr>');
          tr.append($('<td>').html('<img src="icons/'+icon+'"> &nbsp;'+intiativeIndex));
          var td=$('<td>');
          $.each(data, function() {
            var url='<a target="_blank" href="'+this.url+'">'+this.description+'</a>';
            var innerTR=$('<tr>').append($('<td>').html(url));
            td.append(innerTR);
            table.append(tr.append(td));
          });
        });
        reportsDiv.append(table);
        $('.city-reports').append(header);
        $('.city-reports').append(reportsDiv);
      });
    });
  });


  return $.Deferred(function(def) {
    $.when(a, b).done(function() {
      def.resolve();
    });
  });
};


function addCity(efforts, city) {
  efforts[city] = {};
}

function addCategory(efforts, city, category) {
  if (!hasCity(efforts, city)) {
    addCity(efforts, city);
  }
  efforts[city][category] = {};
}

function addInitiative(efforts, city, category, initiative) {

  var initiativeObj = {
    'icon': getIconPath(initiative),
    'layer': emptyVectorlayer(city + category + initiative, styleFunction)
  };

  if (!hasCategory(efforts, city, category)) {
    addCategory(efforts, city, category);
  }
  efforts[city][category][initiative] = initiativeObj;
}

function addFeature(efforts, feature) {
  var city = feature.getProperties().City;
  var initiative = feature.getProperties().Initiative;
  var category = feature.getProperties().Category;

  if (!hasInitiative(efforts, city, category, initiative)) {
    addInitiative(efforts, city, category, initiative);
  }

  efforts[city][category][initiative].layer.getSource().addFeature(feature);

}

function hasInitiative(efforts, city, category, initiative) {
  if (efforts && efforts[city] && efforts[city][category] && efforts[city][category][initiative]) {
    return true;
  }
  return false;
}

function hasCategory(efforts, city, category) {

  if (efforts && efforts[city] && efforts[city][category]) {
    return true;
  }
  return false;
}

function hasCity(efforts, city) {

  if (efforts && efforts[city]) {
    return true;
  }
  return false;
}

function executeDataDependencyFunction() {
  // Handle the user selection
  /*var handleCheckBoxOnClick = function() {
    var layers = map.getLayers();
    var $selectedCities = $('input[name="layers"]:not("#All"):checkbox:checked');
    $.each(efforts, function() {
      this.layer.setVisible(false);
    });

    $selectedCities.map(function() {
      efforts[this.value].layer.setVisible(true);
    });
  };*/
  // Handle the user selection
  var handleCategoriesCheckBoxOnClick = function() {
    var layers = map.getLayers();
    var $selectedCategories = $('input[name="categoriesCheckBox"]:checkbox:not(:checked)');

    for (var i = 0; i < layers.getLength(); i++) {
      layers.item(i).setVisible(true);
      var layerName = layers.item(i).get('name');
      $selectedCategories.map(function(index, element) {
        var category = element.value;
        if (layerName.indexOf(category) > -1) {
          layers.item(i).setVisible(false);
        }
      });
    }

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


    var categoriesDiv = $.parseHTML('<a href="#" class="toggle-category">Sustainability Initiatives</a><div id="toggle-category-marker" class="toggle-category-marker"><a href="#" class="toggle-category-marker-closer"></a></div><div class="categoryListRadio"><dl class="categoryList"></dl></div>');

    var dtTag = $(categoriesDiv).find('.categoryList');
    categories = getCategories();
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
    $.each($('input[name="categoriesCheckBox"]:checkbox'), function() {
      this.checked = true;
    });
    var layers = map.getLayers();
    for (var i = 0; i < layers.getLength(); i++) {
      layers.item(i).setVisible(true);
    }

    $('.sustainable-map-categories').show();
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

  map.on('pointermove', function(evt) {
    if (evt.dragging) {
      return;
    }
    var informationContent = '';
    var overlayCoordinate = evt.coordinate;
    var foundEffort = false;
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {

      if (feature) {
        var properties = feature.getProperties();

        if (!properties.NAME && properties.City) { //If feature is from effort layer
          informationContent = informationContent + getPopUpContent(feature);
          foundEffort = true;
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


  $.each(cityBoundaries, function() {
    map.addLayer(this.layer);
  });

  $.each(efforts, function(cityIndex, city) {
    $.each(city, function(categoryIndex, category) {
      $.each(category, function(initiativeIndex, initiative) {
        map.addLayer(initiative.layer);
      });
    });
  });

  map.addControl(categoryFeatureController);
  //$('.categoryListRadio').hide();
  //$('.toggle-category-marker-closer').toggleClass('lower');

  $('.toggle-category-marker').on('click', function() {
    $('.categoryListRadio').toggle('slow');
    $('.toggle-category-marker-closer').toggleClass('lower');
  });

  $('.toggle-category').on('click', function() {
    $('.categoryListRadio').toggle('slow');
    $('.toggle-category-marker-closer').toggleClass('lower');
  });

  $('.sustainable-map-categories').show();


}

function getIconPath(name) {
  return 'icons/' + name + '.png';
}

function getCategories() {
  var categories = {};
  $.each(efforts, function(cityIndex, city) {
    $.each(city, function(categoryIndex, category) {
      $.each(category, function(initiativeIndex, initiative) {

        if (!categories[categoryIndex]) {
          categories[categoryIndex] = {};
        }

        if (!categories[categoryIndex][initiativeIndex]) {
          categories[categoryIndex][initiativeIndex] = {
            'icon': getIconPath(initiativeIndex),
          };
        }

      });
    });
  });
  return categories;
}

function styleFunction(feature, resolution) {
  var currentZoom = map.getView().getZoom();
  var properties = feature.getProperties();
  var initiative = properties.Initiative;

  if ($('input[id="' + initiative + '"]:checkbox:checked').length == 1) {

    if (initiative == 'Light rail extension') {
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'blue',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'blue'
        })
      })];

    } else if (initiative == 'Light Rail') {

      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'yellow',
          width: 2
        }),
        fill: new ol.style.Fill({
          color: 'yellow'
        })
      })];

    } else if (initiative == 'Street Car') {

      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 2
        }),
        fill: new ol.style.Fill({
          color: 'red'
        })
      })];

    }

    if (currentZoom < zoom + 1) {
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
    } else {
      return [getMarkerIconStyle(getIconPath(initiative))];
    }

  } else {
    return null;
  }
}

function regionStyle(feature, resolution) {
  var properties = feature.getProperties();
  return [new ol.style.Style({
    fill: new ol.style.Fill({
      color: properties.color !== undefined ? properties.color : 'rgba(0,255,255,0.5)'
    }),
    stroke: new ol.style.Stroke({
      color: properties.strokeColor !== undefined ? properties.strokeColor : 'rgba(0, 0, 0,1)',
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

function getMarkerIconStyle(uri) {
  return new ol.style.Style({
    image: iconStyle(uri)
  });
}
