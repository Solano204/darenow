/**
 * Pruebas de borrarTodosLosDatos(): que no quede ninguna clave "forja:*" y
 * que el store quede en estado inicial.
 *
 * borrarTodosLosDatos() en si vive en cuenta.ts y llama a AsyncStorage real
 * (y a react-native via store.ts), asi que no se puede ejercitar aqui
 * directamente: este runner es esbuild+node plano, sin mocks de
 * AsyncStorage ni de React. En vez de eso se prueban las dos piezas puras
 * de las que depende, que SI son testeables asi: la logica de seleccion de
 * claves (clavesForja.ts) y la forma del estado inicial (estadoInicial.ts).
 *
 * esbuild --bundle --platform=node --format=cjs tests/borrarTodo.test.ts | node
 */
import { seleccionarClavesForja, PREFIJO_FORJA } from '@/storage/clavesForja';
import { ESTADO_INICIAL, PERFIL_INICIAL, FAVORITOS_VACIOS } from '@/state/estadoInicial';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

console.log('\n--- seleccionarClavesForja ---');
{
  const conocidas = [
    'forja:cuenta:v1', 'forja:v1', 'forja:voz', 'forja:haptics',
    'forja:ajustes_maquina', 'forja:sesion_en_curso',
  ];

  const soloConocidas = seleccionarClavesForja(conocidas, []);
  c('sin claves existentes, devuelve igual las 6 conocidas',
    conocidas.every(k => soloConocidas.includes(k)) && soloConocidas.length === 6,
    String(soloConocidas.length));

  const existentes = [
    ...conocidas,
    'forja:store_nuevo_del_futuro',       // se agrego un store y se olvido sumarlo a la lista
    '@react-native-firebase/analytics',   // clave de otra libreria: NO debe borrarse
    'expo-secure-store-otra-cosa',        // tampoco
  ];
  const resultado = seleccionarClavesForja(conocidas, existentes);

  c('no queda ninguna clave "forja:*" fuera de la seleccion',
    existentes.filter(k => k.startsWith(PREFIJO_FORJA)).every(k => resultado.includes(k)));
  c('no toca claves de otras librerias',
    !resultado.includes('@react-native-firebase/analytics') && !resultado.includes('expo-secure-store-otra-cosa'));
  c('no duplica una clave que este en ambas listas',
    resultado.filter(k => k === 'forja:v1').length === 1);
}

console.log('\n--- Estado inicial ---');
{
  c('sin sesiones', ESTADO_INICIAL.sesiones.length === 0);
  c('sin mediciones', ESTADO_INICIAL.mediciones.length === 0);
  c('sin rutinas propias', ESTADO_INICIAL.rutinasPropias.length === 0);
  c('sin logros', ESTADO_INICIAL.logros.length === 0);
  c('sin retos', Object.keys(ESTADO_INICIAL.retos).length === 0);
  c('racha en cero', ESTADO_INICIAL.racha.dias === 0 && ESTADO_INICIAL.racha.ultimoDia === null);
  c('onboarding no hecho', ESTADO_INICIAL.onboardingHecho === false);
  c('perfil es el perfil inicial', ESTADO_INICIAL.perfil === PERFIL_INICIAL);
  c('favoritos son los favoritos vacios', ESTADO_INICIAL.favoritos === FAVORITOS_VACIOS);
  c('favoritos realmente vacios', Object.values(ESTADO_INICIAL.favoritos).every(a => a.length === 0));
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
process.exit(fallos ? 1 : 0);
