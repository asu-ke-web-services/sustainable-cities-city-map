# sustainable-cities-city-map
This map is for the https://sustainablecities.asu.edu/ website.

This map uses coordinate system in `EPSG:3857` format. The CSV file `AllEfforts.csv` is in already in `EPSG:3857` format, however any new features added may need to be converted.

To convert coordinates use [http://cs2cs.mygeodata.eu/](http://cs2cs.mygeodata.eu/).

# Convert from CSV to geojson
The CSV gile should be able to be converted into a GeoJSON files by [qGIS](http://www.qgis.org/).
## Steps
  * Add CSV file as vector layer
  * Select both Points and LineString layers 
  * Right Click Vector layer and choose `Save As` and choose `GeoJSON` for each layer.
  * Combine both geojson files into a single geojson file by copy and pasting the features alone from second file to first file. 4
