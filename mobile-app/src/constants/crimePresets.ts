export interface QuickTagGroup {
  label: string;
  tags: string[];
}

export const CRIME_QUICK_PRESETS: Record<string, QuickTagGroup[]> = {
  // Robo / Asalto
  'cat-del-01': [
    {
      label: 'Sujetos y Transporte',
      tags: [
        '2 sujetos en moto lineal',
        'Sujeto con capucha',
        'En mototaxi azul',
        'Auto oscuro sospechoso',
        'A pie en grupo',
      ],
    },
    {
      label: 'Armas y Peligro',
      tags: [
        'Con arma de fuego visible',
        'Con arma blanca / cuchillo',
        'Amenaza física',
        'Disparos al aire',
      ],
    },
    {
      label: 'Momento y Estado',
      tags: [
        'Está ocurriendo en este momento',
        'Acaba de ocurrir (hace minutos)',
        'Están dándose a la fuga',
        'Víctima necesita auxilio',
      ],
    },
  ],

  // Extorsión
  'cat-del-02': [
    {
      label: 'Tipo de Extorsión',
      tags: [
        'Dejaron sobre o nota amenazante',
        'Llamadas / audios extorsivos',
        'Mensajes de WhatsApp amenazantes',
        'Exigen cupo a comercio / bodega',
        'Disparos a fachada del local',
      ],
    },
    {
      label: 'Datos de los Extorsionadores',
      tags: [
        'Se identifican como banda',
        'Dejaron número de cuenta / Yape',
        'Piden monto de dinero',
        'Amenazan a familiares',
      ],
    },
  ],

  // Violencia Familiar
  'cat-del-03': [
    {
      label: 'Situación Actual',
      tags: [
        'Gritos de auxilio en inmueble',
        'Agresión física en curso',
        'Agresión verbal e insultos',
        'Menores de edad en riesgo',
        'Amenaza de muerte',
        'Persona encerrada / retenida',
      ],
    },
  ],

  // Drogas
  'cat-del-04': [
    {
      label: 'Actividad Observada',
      tags: [
        'Punto de venta y pase de droga',
        'Consumo en parque / vía pública',
        'Entrada y salida constante de sujetos',
        'Venta desde vehículo / mototaxi',
      ],
    },
  ],

  // Sospechosos
  'cat-del-05': [
    {
      label: 'Conducta Sospechosa',
      tags: [
        'Rondando viviendas repetidamente',
        'Tomando fotos a fachadas',
        'Vehículo estacionado sin placa',
        'Marcando puertas / paredes',
        'Merodeando en horas de la noche',
      ],
    },
  ],

  // General / Otro
  default: [
    {
      label: 'Descriptores Rápidos',
      tags: [
        'Sujetos armados',
        'En moto lineal',
        'En mototaxi',
        'Ocurriendo ahora mismo',
        'Huyeron hacia avenida principal',
        'Gritos de auxilio',
        'Sospechosos en la zona',
      ],
    },
  ],
};

export const LA_TINGUINA_ZONES = [
  'Plaza de Armas La Tinguiña',
  'Av. Principal',
  'Av. Fonavi',
  'Losa Deportiva San Ildefonso',
  'Mercado Municipal',
  'Parque de las Brujas',
  'Cerca a Colegio',
  'Grifo / Gasolinera',
  'Sector Buenos Aires',
  'Sector Las Malvinas',
  'Sector Los Girasoles',
  'Cruce Av. Julio C. Tello',
];

export const LOCATION_CONTEXT_TAGS = [
  'En plena vía pública',
  'Frente a un comercio / tienda',
  'En esquina poco iluminada',
  'Interior de un inmueble',
  'Frente a parque o losa',
  'Cerca a paradero de motos',
];

export const COMMUNITY_QUICK_PRESETS: Record<string, string[]> = {
  'cat-civ-01': [
    'Poste con luz apagada',
    'Cables sueltos o colgando',
    'Luz parpadeante constante',
    'Toda la cuadra a oscuras',
    'Foco roto por vandalismo',
  ],
  'cat-civ-02': [
    'Hueco profundo en la pista',
    'Bache que causa frenazos',
    'Zanja abierta sin señalizar',
    'Pista hundida tras lluvia',
    'Vereda rota intransitable',
  ],
  'cat-civ-03': [
    'Basura acumulada en esquina',
    'Desmonte de construcción en vereda',
    'Desperdicios que generan mal olor',
    'Bolsas rotas por animales',
  ],
  'cat-civ-04': [
    'Juegos infantiles rotos',
    'Parque sin iluminación',
    'Bancas destruidas',
    'Rejas caídas o faltantes',
  ],
  'cat-civ-05': [
    'Música a alto volumen en la madrugada',
    'Fiesta en la vía pública',
    'Taller mecánico con ruidos excesivos',
    'Gritos y peleas constantes',
  ],
  default: [
    'Afecta el paso peatonal',
    'Peligro para niños y ancianos',
    'Riesgo de accidente vehicular',
    'Lleva varios días sin solución',
  ],
};

