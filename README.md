# sustainable-cities-city-map
This map is for the https://sustainablecities.asu.edu/ website.

This map uses coordinate system in EPSG:3857 format

To convert coordinates from one system to other use http://cs2cs.mygeodata.eu/

# Convert from CSV to geojson
The CSV gile should be able to be converted into a GeoJSON files by qGIS.
## Steps
  * Add CSV file as vector layer
  * Select both Points and LineString layers 
  * Click on each layer and save as geojson 
  * Combine both geojson files into a single geojson file by copy and pasting the features alone from second file to first file.
