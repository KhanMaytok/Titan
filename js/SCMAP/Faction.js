/**
* @author Lianna Eeftinck / https://github.com/Leeft
*/

SCMAP.Faction = function ( data ) {

   this.id = undefined;
   this.name = 'Unclaimed';
   this.isRealFaction = false;
   this.color = new THREE.Color( 0xFFFFFF );
   this.planeColor = new THREE.Color( 0xFF0000 );
   this.lineColor = new THREE.Color( 0xFFFF00 );
   this.parentFaction = null;

   this.setValues( data );

   // Internals
   this._claimed = {
      systems: {}
   };
   this._darkMaterial = undefined;

};

SCMAP.Faction.prototype = {
   constructor: SCMAP.Faction,

   claim: function ( system ) {
      if ( system instanceof SCMAP.System === false ) {
         new Error( "A faction can only claim ownership over a system" );
         return;
      }
      this._claimed.systems[ system.uuid ] = true;
      return this;
   },

   claimed: function ( system ) {
      if ( system instanceof SCMAP.System === false ) {
         new Error( "A faction can only test ownership over a system" );
         return;
      }
      return this._claimed.systems[ system.uuid ];
   },

   material: function ( ) {
      if ( typeof this._darkMaterial === 'undefined' ) {
         this._darkMaterial = new THREE.MeshBasicMaterial({
            color: this.planeColor, vertexColors: true });
      }
      return this._darkMaterial;
   },

   isHostileTo: function ( comparedTo ) {
      if ( !( comparedTo instanceof SCMAP.Faction ) ) {
         throw "Can only compare to other factions";
      }
      // TODO: more data in database, more logic here
      // rather than lots of hardcoding
      if ( comparedTo.name === 'Vanduul' ) {
         return ( this.name !== 'Vanduul' );
      } else {
         return ( this.name === 'Vanduul' );
      }
   },

   getValue: function ( key ) {
      if ( key === undefined ) {
         return;
      }
      var value = this[ key ];
      return value;
   },

   setValues: function ( values ) {
      if ( values === undefined ) {
         return;
      }

      for ( var key in values ) {

         var newValue = values[ key ];
         if ( newValue === undefined ) {
            console.log( 'SCMAP.Faction: "' + key + '" parameter is undefined for "'+this.name+'"' );
            continue;
         }

         if ( key in this )
         {
            var currentValue = this[ key ];
            if ( currentValue instanceof THREE.Color ) {

               if ( newValue instanceof THREE.Color ) {
                  this[ key ] = newValue;
               } else {
                  newValue = newValue.replace( '0x', '#' );
                  this[ key ] = new THREE.Color( newValue );
               }
               if ( key === 'color' ) {
                  this.planeColor = this[ key ].clone().offsetHSL( 0, 0.5, 0 ).multiplyScalar( 0.20 );
                  this.lineColor = this[ key ].clone().offsetHSL( 0, 0.05, -0.05 );
               }

            } else {
               this[ key ] = newValue;
            }
         }

      }
   }
};

SCMAP.Faction.preprocessFactions = function ( data ) {
   var factionId, faction;

   SCMAP.data.factionsByName = {};

   for ( factionId in data ) {

      if ( data.hasOwnProperty( factionId ) ) {

         faction = data[ factionId ];

         if ( !( faction instanceof SCMAP.Faction ) ) {

            faction = new SCMAP.Faction({
               id: factionId,
               name: faction.name,
               color: faction.color,
               isRealFaction: faction.isRealFaction,
               parentFaction: null
            });

         }

         SCMAP.data.factions[ factionId ]          = faction;
         SCMAP.data.factionsByName[ faction.id ]   = faction;
         SCMAP.data.factionsByName[ faction.name ] = faction;

      }
   }
};

SCMAP.Faction.getById = function ( id ) {
   var faction = SCMAP.data.factions[ id ];
   if ( ! ( faction instanceof SCMAP.Faction ) ) {
      faction = SCMAP.data.factionsByName.Unclaimed;
   }
   return faction;
};

SCMAP.Faction.getByName = function ( name ) {
   var faction = SCMAP.data.factionsByName[ name ];
   if ( ! ( faction instanceof SCMAP.Faction ) ) {
      faction = SCMAP.data.factionsByName.Unclaimed;
   }
   return faction;
};

// EOF
