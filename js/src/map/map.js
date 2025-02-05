
GSIBV.Map = class extends MA.Class.Base {


  constructor(container, options) {
    super();
    this._container = container;
    this._layerList = new GSIBV.Map.LayerList(this);
    this._layerList.on("change", MA.bind(this._onLayerListChange, this));
    this._controlLayerList = new GSIBV.Map.LayerList(this);
    this._momoryPointsNum = 1;
    this._startUp = {
      zoom: 7,
      center: [140.084556, 36.104611]
    };

    if (options) {
      if (options.zoom || options.zoom == 0) this._startUp.zoom = options.zoom;
      if (options.center) this._startUp.center = options.center;
      if (options.spriteList) this._spriteList = options.spriteList;
      if (options.localFont) this._localFont = options.localFont;


    }
    if (!this._spriteList) this._spriteList = GSIBV.CONFIG.Sprite.list;
    this._refreshBackground();
  }

  get map() { return this._map; }
  get layerList() { return this._layerList; }
  get ccontrolLayerList() { return this._controlLayerList; }

  initialize(params) {
    if (typeof this._container == "string") {
      this._container = MA.DOM.select(this._container)[0];
    }

    if (params) {
      if (params.center) this._startUp.center = params.center;
      if (params.zoom) this._startUp.zoom = params.zoom;
    }
    this._loadSprite();
    //this.initializeMap();
  }

  _loadSprite() {
    this._spriteManager = new GSIBV.Map.SpriteManager();
    this._spriteManager.on("load", MA.bind(this._onLoadSprite, this));

    for( var i=0; i<this._spriteList.length; i++ ) {
      var sprite = this._spriteList[i];
      this._spriteManager.add(sprite.id, sprite.title, sprite.url );
    }
  }
  _onLoadSprite() {
    
    for( var i=0; i<this._spriteList.length; i++ ) {
      if (!this._spriteManager.isLoaded( this._spriteList[i].id ) ) return;
    }
    
    this.initializeMap();
  }

  _getDefaultSpriteUrl() {


    var path = location.pathname;
    var spriteUrl = location.protocol + "//" + location.host + "/";
    var m = path.match(/\/([^.\/]+.html)$/i);
    if (m) {
      spriteUrl += path.replace(m[1], "/sprite/sprite");
    } else {
      if (path.match(/\/$/))
        spriteUrl += path + "sprite/sprite";
      else
        spriteUrl += path + "/sprite/sprite";
    }

    return spriteUrl;
  }

  initializeMap(options) {

    var mapOptions = {
      container: this._container, //
      style: {
        "version": 8,
        "layers": [],
        "sources": {},
        "glyphs": "https://maps.gsi.go.jp/xyz/noto-jp/{fontstack}/{range}.pbf"

      },
      zoom: this._startUp.zoom,
      minZoom: 2,
      maxZoom: 17,
      center: this._startUp.center,
      boxZoom: false,
      pitchWithRotate: true, // pitch可
      transformRequest : MA.bind(this._onTransformRequest,this)
    };
    if (this._localFont) {
      mapOptions["localIdeographFontFamily"] = this._localFont;

    }

    var map = new mapboxgl.Map(mapOptions);

    map.on("data", function (e) {
      //console.log(e);
    });
    GSIBV.Map.HatchImageManager.create(map);

    GSIBV.Map.ImageManager.create(map);

    var scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    });
    map.addControl(scale, 'bottom-right');

    var nav = new mapboxgl.NavigationControl({ showCompass: false });
    map.addControl(nav, 'bottom-right');

    var resetPitchRotate = new GSIBV.Map.Control.ResetPitchRotateControl({});
    map.addControl(resetPitchRotate, 'bottom-right');


    map.on("load", MA.bind(this._onLoad, this));
    map.on("move", MA.bind(this._onMove, this));
    map.on("moveend", MA.bind(this._onMoveEnd, this));
    map.on("click", MA.bind(this._onClick, this));
    map.on("contextmenu", MA.bind(this._onContextMenu, this));
    map.on("data", MA.bind(this._onDataLoad, this));
    /*
    var debug = function() {
        var center = map.getCenter();
        var z = map.getZoom();
        MA.DOM.select("#debug .pos")[0].innerHTML = 
            ( Math.round( center.lat *1000000 ) / 1000000 ) + "," + 
            ( Math.round( center.lng *1000000 ) / 1000000 ) + "," + 
            ( Math.round( z *1000 ) / 1000 );

    };
    debug();
    map.on("move",debug);
    */
    this._map = map;


    this._fireMoveEvent("move");
  }

  _onTransformRequest(url, resourceType) {
    //if ( resourceType !== "Tile" ) return;


    return;

    //"https://maps.gsi.go.jp/xyz/mapboxtestdata1005/17/116552/51671.pbf";
    var regex = /^http[s]*:\/\/maps.gsi.go.jp\/xyz\/mapboxtestdata1005\/([0-9]+)\/([0-9]+)\/([0-9]+)\.pbf$/i;
    var m = url.match( regex);

    if ( m ) {
      var zoomList = [5,7,9,12,15,18]
      var zoom = parseInt(m[1]);
      for( var i=0; i<zoomList.length; i++) {
        if ( zoomList[i] == zoom ) return;
      }
      return {"url":"about:blank"};
      
    } else {
      
    }
      
  }

  get center() {
    return this._map.getCenter();
  }
  get zoom() {
    return this._map.getZoom();
  }

  get searchResultLayer() {
    return this._searchResultLayer;
  }
  get mousePositionControl() {
    return this._mousePositionControl;
  }
  get centerCrossControl() {
    return this._centerCross;
  }

  get spriteManager() {
    return this._spriteManager;
  }

  _onLoad() {

    var list = this._spriteManager.getList();

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      this._map.addImage(GSIBV.Map.SpriteManager.spriteId( item.id, item.info.id ), 
          item.img, { pixelRatioany: 1 })
    }
    this._initializeMapControlLayers();
    this.fire("load");

  }
  _onDataLoad(e) {
  }
  _initializeMapControlLayers() {


    //this._createCenterCross();
    //this._createMousePosition();

    this._centerCross = new GSIBV.Map.CenterCross(this._map);
    this._mousePositionControl = new GSIBV.Map.MousePosition(this._map);
    /*
    this._mousePositionLayer = new GSIBV.Map.ControlLayer.MousePosition();
    this.addControlLayer( this._mousePositionLayer );
    
    this._centerCrossLayer = new GSIBV.Map.ControlLayer.CenterCross();
    this.addControlLayer( this._centerCrossLayer );
    */
    this._searchResultLayer = new GSIBV.Map.ControlLayer.SearchResult();
    this.addControlLayer(this._searchResultLayer);
  }

  _fireMoveEvent(eventType) {
    this.fire(eventType, {
      center: this._map.getCenter(),
      zoom: this._map.getZoom()
    });
  }

  
  _onMove(e) {
    if ( this._popupContextMenu ) this._popupContextMenu.hide();
    this._fireMoveEvent("move");
  }
  _onMoveEnd(e) {
    this._fireMoveEvent("moveend");
  }

  _onContextMenu(e) {
    this.showPopupContextMenu(e.lngLat,{
      left:e.originalEvent.clientX, 
      top:e.originalEvent.clientY
    });
  }

  _addMemoryPoint( latlng, zoom ) {
    if ( !this._memoryPointList ) {
      this._memoryPointList = [];
    }

    while( this._memoryPointList.length >= this._momoryPointsNum ) {
      this._memoryPointList.shift();
    }

    var memoryPoint = {
      "latlng" : latlng,
      "zoom" :zoom,
      "title" : "[住所読み込み中]"
    };

    memoryPoint._addrLoader = new GSIBV.Map.Util.AddrLoader();
    memoryPoint._addrLoader.on("load", MA.bind(function (memoryPoint,e) {
      memoryPoint["title"] = (e.params.title ? e.params.title.replace(/[\s]/g,"") : "[不明な地点]");
    }, this, memoryPoint));

    memoryPoint._addrLoader.load(latlng);

    
    this._memoryPointList.push (memoryPoint );


  }


  showPopupContextMenu(latlng, pos) {

    var menuItems = [];

    var lang = GSIBV.application.lang;

    var langCaption = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.MAPPOPUP;
    var vectorTile = ( lang != "ja" ? GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE : null );
    
    if ( !GSIBV.CONFIG.ReadOnly ) {
      var features = ( latlng ? GSIBV.Map.getPointFeatures( this._map, latlng,3 ) : [] );
      
      if ( features.length > 0 ) {
        if ( menuItems.length > 0 ) {
          menuItems.push( {"type":"separator"} );
        }


        for( var i=0; i<features.length; i++ ) {
          
          var item = {
            "id" : "feature",
            "title" : langCaption["unknownobject"]
          };

          var feature = features[i];
          if (feature.layer.metadata ) {
            if ( feature.layer.metadata.title ) {
              
              if ( vectorTile) {
                var path = feature.layer.metadata.path;
                var pathParts = path.split( "-");

                for( var j=0; j<pathParts.length; j++ ) {
                  var langPath= vectorTile[pathParts[j]];
                  if ( langPath ) pathParts[j] = langPath;

                }
                item.title = pathParts.join("-") ;
              } else {
                item.title = feature.layer.metadata.path ;
              }
            }
            
            if ( feature.layer.metadata["layer-id"] ) {
              item["layer-id"] = feature.layer.metadata["layer-id"];
            }
          }
          
          menuItems.push(item);
        }
      }
    }

    if ( this._map.getPitch() != 0 || this._map.getBearing() != 0 ) {
      if ( menuItems.length > 0  ) menuItems.push( {"type":"separator"} );
      menuItems.push( 
        {"id":"resetpitchbearing","title": langCaption["resetrotation"]}
      );
    }
    
    if ( menuItems.length > 0  ) menuItems.push( {"type":"separator"} );

    var memoryTitle = langCaption["remember"] + ( this._momoryPointsNum > 1 ? " (" + langCaption["max"] + this._momoryPointsNum + ")" : "" );
    menuItems.push( 
      {"id":"memorypoint","title": memoryTitle, latlng:latlng, zoom: this._map.getZoom()}
    );
    if ( this._memoryPointList ) {
      for( var i =0; i<this._memoryPointList.length; i++ ) {
        var p = this._memoryPointList[i]
        menuItems.push( 
          {"id":"memorypoint-select","title": p.title + ( lang == "ja" ? "付近に移動" : "" ), latlng:p.latlng, zoom: p.zoom }
        );
      }
    }



    if ( menuItems.length <= 0 ) return;

    if (!this._popupContextMenu ) {
      this._popupContextMenu = new GSIBV.UI.Popup.Menu ();
      this._popupContextMenu.on("select",MA.bind(function(e){
        if ( e.params.item.id == "resetpitchbearing") {
          this.resetPitchBrearing();
        } else if ( e.params.item.id == "feature") {
          this.fire("requestlayeredit", {"layer-id" : e.params.item["layer-id"]})
        } else if ( e.params.item.id == "memorypoint" ) {
          this._addMemoryPoint( e.params.item.latlng, e.params.item.zoom );
        
        } else if ( e.params.item.id == "memorypoint-select" ) {
          this._map.flyTo( { center:e.params.item.latlng,zoom : e.params.item.zoom} );
        }
        //this._map.resetNorth({}, { "exec": "resetrotate" });
        
      },this));
    }

    this._popupContextMenu.items = menuItems;
    this._popupContextMenu.show(null, pos);

  }

  resetPitchBrearing() {
    this._map.easeTo({ pitch: 0, bearing : 0}, { "exec": "resetpitch" });
  }

  static getPointFeatures( map, latLng, around) {
    var point = map.project(latLng);

    var featuresAll = [];
    var layerIdHash = {};
    //around = 0;
    
    if ( around == undefined) around = 0;

    for (var x = point.x - around; x <= point.x + around; x++) {

      for (var y = point.y - around; y <= point.y + around; y++) {
        var features = map.queryRenderedFeatures(new mapboxgl.Point(x, y));
        
        for (var i = 0; i < features.length; i++) {
          var feature = features[i];
          if (feature.properties["-gsibv-control"]) continue;
          var id = feature.layer.id;
          if ( feature.layer.metadata && feature.layer.metadata["layer-id"])
            id = feature.layer.metadata["layer-id"];
          
          if (layerIdHash[id]) continue;
          featuresAll.push(feature);
          layerIdHash[id] = true;
        }
      }
    }
    return featuresAll;

  }

  _onClick(e) {


    var featuresAll = [];
    var layerIdHash = {};

    for (var x = e.point.x - 3; x <= e.point.x + 3; x++) {

      for (var y = e.point.y - 3; y <= e.point.y + 3; y++) {
        var features = this._map.queryRenderedFeatures(new mapboxgl.Point(x, y));
        for (var i = 0; i < features.length; i++) {
          var feature = features[i];
          if (layerIdHash[feature.layer.id] || (!feature.sourceLayer && !feature.properties["-gsibv-popupContent"])) continue;
          featuresAll.push(feature);
          layerIdHash[feature.layer.id] = true;
        }
      }
    }
    var latLng = e.lngLat;
    if (featuresAll.length > 0) {
      var html = '';
      for (var i = 0; i < featuresAll.length; i++) {
        if (featuresAll[i].properties["-gsibv-popupContent"]) {
          html = featuresAll[i].properties["-gsibv-popupContent"];
          break;
        }
      }
      if (html != '') {
        var popup = new mapboxgl.Popup({ "className": "-gisbv-popup-content" })
          .setLngLat(latLng)
          .setHTML(html)
          .addTo(this._map);
      }
    }
  }

  flyTo(center, zoom) {
    if (!center || !zoom) return;

    if (center.lat)
      this._map.flyTo({ center: [center.lng, center.lat], zoom: zoom });
    else
      this._map.flyTo({ center: center, zoom: zoom });

  }
  setView(latlng) {
    if ((latlng.lat || latlng.lat == 0) && (latlng.lng || latlng.lng == 0)) {
      this._map.setCenter([latlng.lng, latlng.lat]);
    }
    if (latlng.z || latlng.z == 0) {
      this._map.setZoom(latlng.z);
    }
  }

  _onLayerListChange(e) {
    //this.fire("layerchange");

    this._refreshBackground();

    switch (e.params.type) {

      case "add":
        if (!this._layerChangeHandler)
          this._layerChangeHandler = MA.bind(this._onLayerChange, this);
        e.params.layer.on("change", this._layerChangeHandler);

        break;

      case "remove":
        e.params.layer.off("change", this._layerChangeHandler);
        break;
    }

    this.fire("layerchange");
  }
  _onLayerChange() {
    this.fire("layerchange");
  }

  _refreshBackground() {

    var noLayer = true;
    if (this._layerList) {
      for (var i = 0; i < this._layerList.length; i++) {
        if (this._layerList.get(i).visible) {
          noLayer = false;
          break;
        }
      }
    }

    if (noLayer) {

      this._container.style.background = "#555";
      this._container.style.backgroundImage = 'url(\'data:image/svg+xml,<svg height="8" fill="rgba(255,255,255,0.1)" viewBox="0 0 8 8" width="8" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="4" height="4" /><rect x="4" y="4" width="4" height="4" /></svg>\')';
    }
    else {
      this._container.style.background = "#ffffff";
    }
  }


  addLayer(layer) {
    if (!this._vectorTileLoadHandler) {
      this._vectorTileLoadHandler = MA.bind(this._onVectorTileLoad, this);
    }
    layer.on("loading", this._vectorTileLoadHandler);
    layer.on("load", this._vectorTileLoadHandler);
    layer.on("breakpoint", this._vectorTileLoadHandler);
    layer.on("finish", this._vectorTileLoadHandler);

    var result = this._layerList.add(layer);


    this._controlLayerList.refreshLayerOrder();

    return result;
  }

  removeLayer(layer) {
    this._layerList.remove(layer);



    layer.off("loading", this._vectorTileLoadHandler);
    layer.off("load", this._vectorTileLoadHandler);
    layer.off("breakpoint", this._vectorTileLoadHandler);
    layer.off("finish", this._vectorTileLoadHandler);

    this._controlLayerList.refreshLayerOrder();
  }


  addControlLayer(layer) {
    var result = this._controlLayerList.add(layer);
    return result;
  }

  removeControlLayer(layer) {
    this._controlLayerList.remove(layer);
  }


  clearLayers() {
    this._layerList.clear();


  }

  moveLayer(layer, inc) {
    if (inc < 0)
      this._layerList.up(layer, Math.abs(inc));
    else if (inc > 0)
      this._layerList.down(layer, Math.abs(inc));


    this._controlLayerList.refreshLayerOrder();
  }

  get layers() {
    var result = [];
    for (var i = 0; i < this._layerList.length; i++) {
      result.push(this._layerList.get(i));
    }

    return result;
  }

  _onVectorTileLoad(e) {
    if (!this._loadingVectorTileList)
      this._loadingVectorTileList = [];

    switch (e.type) {
      case "loading":
        this._loadingVectorTileList.push({ "layer": e.from, "state": e.type });
        break;
      case "load":
        for (var i = 0; i < this._loadingVectorTileList.length; i++) {
          if (this._loadingVectorTileList[i].layer == e.from) {
            this._loadingVectorTileList[i].state = e.type;
            break;
          }
        }
        break;
      
      case "breakpoint":
        for (var i = 0; i < this._loadingVectorTileList.length; i++) {
          if (this._loadingVectorTileList[i].layer == e.from) {
            this._loadingVectorTileList[i].state=e.type;
            break;
          }
        }
        break;
      case "finish":
        for (var i = 0; i < this._loadingVectorTileList.length; i++) {
          if (this._loadingVectorTileList[i].layer == e.from) {
            this._loadingVectorTileList.splice(i, 1);
            break;
          }
        }
        break;
    }
    this.fire("vectortile", { "list": this._loadingVectorTileList });

  }

}
