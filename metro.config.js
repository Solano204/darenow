// Metro con la configuracion de Expo. Las fotos y clips originales (media-fuente/) no se empaquetan
// ni se vigilan: la app solo lleva lo que generan `npm run imagenes` y `npm run clips` (R5).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const excluir = /[/\\]media-fuente[/\\].*/;
const previo = config.resolver.blockList;
config.resolver.blockList = previo
  ? [].concat(previo, excluir)
  : excluir;

module.exports = config;
