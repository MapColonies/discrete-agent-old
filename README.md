# Map Colonies Discrete Agent service
----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/discrete-agent?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/discrete-agent?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/discrete-agent?style=for-the-badge)

----------------------------------

This service is used to trigger Map Colonies discrete ingestion flow by watching file system or through rest trigger.

### required file system structure:
each discrete should be in it's own directory and contain the following structure:
- `tiff` directory with the following files:
  - tiff files for discrete creation process
  - tfw file for each tiff file
- `Shapes` directory with the following files:
  - `Files.shp` and `Files.dbf` with a list of tiffs for the discrete. each record should contain `File Name` field (without extension) and `Format` field with the value `Tiff` and the bounding box of each tiff file.
  - `Product.shp` and `Product.dbf` with single record with the following attributes:
    - `Name` - the name of the discrete layer.
    - `Type` - the discrete layer type (eg. `Orthophoto`).
    - `Resolution` - the resolution of the discrete in meters/pixel.
    - the footprint of the discrete
  - `ShapeMetadata.shp` and `ShapeMetadata.dbf` with records for each layer part of the discrete. each layer part record should contain the following fields:
    - footprint of the layer part
    - `Dsc` - description of the discrete layer.
    - `Source` - the identifier of the discrete layer in the format `<discrete name>-<version>`
    - `SourceName` - the name of the discrete layer in the sources system
    - `UpdateDate` - the last modification date of the discrete sources.
    - `Resolution` - the resolution of the discrete in meters/pixel.
    - `EP90` - accuracy of the discrete layer.
    - `Rms` - tolerance % (nullable).
    - `SensorType` - the type of the sensor used to create the discrete layer part (must be supported type from [mc-models](https://github.com/MapColonies/mc-models/blob/master/src/models/layerMetadata/enums.ts)).
    - `Scale` - scale of discrete (nullable).

### Discrete Agent configurations:
 The Discrete agent can be configured with the following environment variables:
 - general configurations:
   - `LOG_LEVEL` - agent minimum log level (must be valid nodejs log level).
   - `SERVER_PORT` - rest api listening port.
   - `MOUNT_DIRECTORY` - mounted sources directory path.
   - `CLASSIFICATION_OPTIONS_FILE_PATH` - path for classification configuration file.
 - file watcher configurations:
   - `WATCH_DIRECTORY` - directory to watch for automatic ingestion triggering. must be relative path from the `MOUNT_DIRECTORY`.
   - `WATCH_MIN_TRIGGER_DEPTH` - minimum depth to watch for changes from the `WATCH_DIRECTORY`.
   - `WATCH_MAX_TRIGGER_DEPTH` - maximum depth to watch for changes from the `WATCH_DIRECTORY`.
   - `WATCH_INTERVAL` - file system polling interval in ms.
   - shp files parser retry configurations (incase of invalid file, to prevent failure due to partial copy):
     - `WATCHER_SHP_RETRY_COUNT` - amount of attempts for parsing shp files.
     - `WATCHER_SHP_RETRY_FACTOR` - factor for exponential backoff.
     - `WATCHER_SHP_RETRY_MIN_TIMEOUT` - minimum delay between shp parsing attempts in ms.
     - `WATCHER_SHP_RETRY_MAX_TIMEOUT` - maximum delay between shp parsing attempts in ms.
     - `WATCHER_SHP_RETRY_RANDOMIZE` - max randomized factor for calculating delay for next attempt.
 - external services configuration:
   - `OVERSEER_URL`: base url for overseer service.
   - `AGENT_DB_URL`: base url for discrete agent db service.
   - http calls retries configurations:
     - `HTTP_RETRY_ATTEMPTS`: amount for retries for rest calls to external services.
     - `HTTP_RETRY_DELAY` - amount of delay between http retries in ms or `exponential` for exponential backoff.
     - `HTTP_RETRY_RESET_TIMEOUT` - defines if http time out should be rest for every attempt (true) or be cumulative (false).

### classification configuration file:
the discrete layer classification value will be generated by the discrete agent based on the json classification configuration file.
the json should contain the following values:
- `polygonCoordinates`: polygon that bounds the internal area for the "internal classifications". the polygon format should be array with the following values:
  - boundary: array of points (array with lat and lon).
  - holes: array of internal boundaries that should be external (optional).
- `defaultValue`: default value for classification if no specific rule applies (number).
- `resolutionRules`: array of resolution based classification rules. if multiple rules match the data the minimum classification value will be applied. each rule should have the following fields:
  - `name` - rule name to make the configuration easier to maintain (optional).
  - `value` - classification value for discrete layers that match the minimum resolution and minimum inclusion rate criterions.
  - `minResolution` - the minimal resolution required to match the rule in meters/pixel (lower number is higher resolution therefore resolution of 0.1 will match rule with minimal resolution of 0.5 but 0.6 will not).
  - `minDataInclusionRate` - minimal part of the discrete layer area that must cover the inner area to match the rule (eg. 0.9 is 90% of the discrete layer must be in the inner area to match the rule).

### usage:
1. run `npm install `.
1. crete classification json config file [see classification configuration section](#classification-configuration-file).
1. configure the discrete agent [see discrete agent configuration section](#discrete-agent-configurations).
1. run `npm run start`.
1. see `/docs/api` for rest api (checking watch status, starting/stopping watcher, manual trigger) 
