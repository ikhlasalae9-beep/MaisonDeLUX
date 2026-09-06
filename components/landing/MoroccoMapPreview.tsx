'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { VERIFIED_CITIES, VerifiedCity, REGIONS_TRANSLATIONS } from '@/config/cities.config';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  SVG_WIDTH,
  SVG_HEIGHT,
  projectCoordinate,
  geometryToPath,
  getInteriorPoint,
  getGeometrySvgBounds,
  SUBDIVISION_TO_CITY_MAPPING,
  PROVINCE_TO_REGION_MAP,
} from '@/lib/estimation/geographicCoverage';
import {
  computeLabelLayout,
  fitBoundsToViewport,
  getScreenTransform,
  LabelCandidate,
} from '@/lib/estimation/mapLabelLayout';

interface MoroccoMapPreviewProps {
  onSelectCity: (city: VerifiedCity) => void;
  locale: string;
}

interface GeoFeature {
  type: string;
  properties: {
    cartodb_id?: number;
    region?: string;
    name?: string;
    shapeName?: string;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
}

interface GeoJsonData {
  type: string;
  features: GeoFeature[];
}

export function MoroccoMapPreview({ onSelectCity, locale }: MoroccoMapPreviewProps) {
  const [regionsData, setRegionsData] = useState<GeoJsonData | null>(null);
  const [provincesData, setProvincesData] = useState<GeoJsonData | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredSubdivision, setHoveredSubdivision] = useState<string | null>(null);
  const [selectedSubdivision, setSelectedSubdivision] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [isLoading]);

  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // Set of supported region keys
  const supportedRegions = useMemo(() => new Set(VERIFIED_CITIES.map((c) => c.regionKey)), []);

  // Map of verified cities by their ID
  const cityById = useMemo(() => {
    const map = new Map<string, VerifiedCity>();
    VERIFIED_CITIES.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Map of verified cities grouped by regionKey
  const citiesByRegion = useMemo(() => {
    const map = new Map<string, VerifiedCity[]>();
    VERIFIED_CITIES.forEach((city) => {
      if (!map.has(city.regionKey)) {
        map.set(city.regionKey, []);
      }
      map.get(city.regionKey)!.push(city);
    });
    return map;
  }, []);

  // Load Level 1 (Regions) and Level 2 (Provinces/Subdivisions) GeoJSON data
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch('/maps/maroc.geojson').then((res) => {
        if (!res.ok) throw new Error('Impossible de charger maroc.geojson');
        return res.json();
      }),
      fetch('/maps/maroc-provinces.geojson').then((res) => {
        if (!res.ok) throw new Error('Impossible de charger maroc-provinces.geojson');
        return res.json();
      }),
    ])
      .then(([regions, provinces]: [GeoJsonData, GeoJsonData]) => {
        if (isMounted) {
          setRegionsData(regions);
          setProvincesData(provinces);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement GeoJSON:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute processed Region layer with interior label points and bounds
  const processedRegions = useMemo(() => {
    if (!regionsData) return [];
    return regionsData.features.map((feature, idx) => {
      const regionKey = feature.properties.region || feature.properties.name || `region-${idx}`;
      const [interiorLon, interiorLat] = getInteriorPoint(feature.geometry);
      const [labelX, labelY] = projectCoordinate([interiorLon, interiorLat]);
      return {
        id: feature.properties.cartodb_id ?? idx,
        regionKey,
        path: geometryToPath(feature.geometry),
        bounds: getGeometrySvgBounds(feature.geometry),
        labelPoint: { x: labelX, y: labelY },
      };
    });
  }, [regionsData]);

  // Compute processed Subdivision layer for the selected region
  const currentSubdivisions = useMemo(() => {
    if (!provincesData || !selectedRegion) return [];

    return provincesData.features
      .filter((feature) => {
        const shapeName = feature.properties.name || feature.properties.shapeName || '';
        return PROVINCE_TO_REGION_MAP[shapeName] === selectedRegion;
      })
      .map((feature, idx) => {
        const shapeName = feature.properties.name || feature.properties.shapeName || '';
        const cityId = SUBDIVISION_TO_CITY_MAPPING[shapeName];
        const verifiedCity = cityId ? cityById.get(cityId) : null;
        const [interiorLon, interiorLat] = getInteriorPoint(feature.geometry);
        const [labelX, labelY] = projectCoordinate([interiorLon, interiorLat]);

        return {
          id: feature.properties.shapeID || `subdiv-${idx}`,
          shapeName,
          verifiedCity,
          path: geometryToPath(feature.geometry),
          bounds: getGeometrySvgBounds(feature.geometry),
          labelPoint: { x: labelX, y: labelY },
        };
      });
  }, [provincesData, selectedRegion, cityById]);

  // Fit selected geometry to the real viewport with a stable margin in screen pixels.
  const viewBounds = useMemo(() => {
    if (selectedRegion) {
      const region = processedRegions.find((r) => r.regionKey === selectedRegion);
      if (region) {
        const fallbackWidth = 800;
        const fallbackHeight = 600;
        return fitBoundsToViewport(
          region.bounds,
          viewport.width || fallbackWidth,
          viewport.height || fallbackHeight,
          viewport.width && viewport.width < 640 ? 34 : 58
        );
      }
    }
    return { minX: 0, minY: 0, maxX: SVG_WIDTH, maxY: SVG_HEIGHT };
  }, [selectedRegion, processedRegions, viewport]);

  const viewBox = `${viewBounds.minX} ${viewBounds.minY} ${viewBounds.maxX - viewBounds.minX} ${viewBounds.maxY - viewBounds.minY}`;

  // Handle region click (Level 1 -> Level 2)
  const handleRegionClick = (regionKey: string) => {
    if (supportedRegions.has(regionKey)) {
      setSelectedRegion(regionKey);
      setHoveredRegion(null);
      setHoveredSubdivision(null);
      setSelectedSubdivision(null);
    }
  };

  // Handle returning to full Morocco view
  const handleReset = () => {
    setSelectedRegion(null);
    setHoveredRegion(null);
    setHoveredSubdivision(null);
    setSelectedSubdivision(null);
  };

  // Handle subdivision click (Level 2 -> Action)
  const handleSubdivisionClick = (subdiv: (typeof currentSubdivisions)[0]) => {
    if (subdiv.verifiedCity) {
      setSelectedSubdivision(subdiv.shapeName);
      onSelectCity(subdiv.verifiedCity);
    }
  };

  const labelLayout = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];
    const transform = getScreenTransform(
      viewBounds,
      viewport.width,
      viewport.height
    );
    const candidates: LabelCandidate[] = selectedRegion
      ? currentSubdivisions.filter((subdiv) => subdiv.verifiedCity).map((subdiv) => ({
          id: String(subdiv.id),
          text: locale === 'ar' ? subdiv.verifiedCity!.nameAr : subdiv.verifiedCity!.nameFr,
          point: subdiv.labelPoint,
          bounds: subdiv.bounds,
          priority: 10,
          active: true,
          hovered: hoveredSubdivision === subdiv.shapeName,
          selected: selectedSubdivision === subdiv.shapeName,
        }))
      : processedRegions.map((region) => ({
          id: String(region.id),
          text: REGIONS_TRANSLATIONS[region.regionKey]
            ? locale === 'ar'
              ? REGIONS_TRANSLATIONS[region.regionKey].nameAr
              : REGIONS_TRANSLATIONS[region.regionKey].nameFr
            : region.regionKey,
          point: region.labelPoint,
          bounds: region.bounds,
          priority: supportedRegions.has(region.regionKey) ? 10 : 1,
          active: supportedRegions.has(region.regionKey),
          hovered: hoveredRegion === region.regionKey,
          allowTwoLines: true,
        }));
    return computeLabelLayout(candidates, transform, viewport.width, !!selectedRegion, isRTL);
  }, [viewport, viewBounds, selectedRegion, currentSubdivisions, processedRegions, locale,
    supportedRegions, hoveredRegion, hoveredSubdivision, selectedSubdivision, isRTL]);

  return (
    <div className="relative w-full aspect-square md:aspect-[4/3] max-w-4xl mx-auto bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden shadow-xs">
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                className="stroke-slate-200/80 dark:stroke-white/10"
                strokeWidth="0.6"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#archGrid)" />
        </svg>
      </div>

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-3 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin" />
          <span className="text-sm text-slate-500 font-medium">
            {locale === 'ar'
              ? 'جارٍ تحميل البيانات الجغرافية والإدارية...'
              : 'Chargement des données cartographiques administratives...'}
          </span>
        </div>
      ) : (
        <div className="relative w-full flex-1 z-10 flex items-center justify-center p-4">
          {/* Top Level 2 Controls: Return Button & Breadcrumb */}
          {selectedRegion && (
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20">
              <button
                onClick={handleReset}
                className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold"
              >
                <ArrowIcon className="w-4 h-4" />
                <span>{locale === 'ar' ? 'العودة إلى خريطة المغرب' : 'Retour à la carte'}</span>
              </button>

              <div className="hidden sm:flex items-center px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-slate-200 dark:border-slate-700 text-xs font-semibold text-brand-blue dark:text-blue-400 shadow-xs">
                <span>
                  {REGIONS_TRANSLATIONS[selectedRegion]
                    ? locale === 'ar'
                      ? REGIONS_TRANSLATIONS[selectedRegion].nameAr
                      : REGIONS_TRANSLATIONS[selectedRegion].nameFr
                    : selectedRegion}
                </span>
              </div>
            </div>
          )}

          {/* Interactive SVG Canvas */}
          <div className="w-full h-full relative" ref={mapRef}>
            <svg
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full select-none transition-all duration-700 ease-in-out"
              aria-label="Explorateur territorial MaisonDeLUX"
              role="region"
            >
              {/* ========================================================================= */}
              {/* LEVEL 1: REGION POLYGONS LAYER                                           */}
              {/* ========================================================================= */}
              {!selectedRegion && <g className="regions-layer">
                {processedRegions.map(({ id, regionKey, path }) => {
                  const isSupported = supportedRegions.has(regionKey);
                  const isRegionHovered = hoveredRegion === regionKey;

                  const regionName = REGIONS_TRANSLATIONS[regionKey]
                    ? locale === 'ar'
                      ? REGIONS_TRANSLATIONS[regionKey].nameAr
                      : REGIONS_TRANSLATIONS[regionKey].nameFr
                    : regionKey;

                  // Level 1 styling
                  let fillClass = 'fill-slate-100 dark:fill-slate-800/80';
                  let strokeClass = 'stroke-white dark:stroke-slate-700 stroke-[0.8]';
                  let cursorClass =
                    isSupported && !selectedRegion ? 'cursor-pointer' : 'cursor-default';
                  if (isSupported) {
                    fillClass = 'fill-brand-blue/10 dark:fill-brand-blue/15';
                    strokeClass = 'stroke-white dark:stroke-slate-800 stroke-[1]';

                    if (isRegionHovered) {
                      fillClass = 'fill-brand-blue/20 dark:fill-brand-blue/30';
                      strokeClass = 'stroke-brand-blue/60 dark:stroke-blue-400/60 stroke-[1.5]';
                    }
                  } else {
                    fillClass = 'fill-slate-50 dark:fill-slate-900/40';
                    strokeClass = 'stroke-slate-200 dark:stroke-slate-800 stroke-[0.8]';
                    if (isRegionHovered) {
                      fillClass = 'fill-slate-100 dark:fill-slate-800/60';
                    }
                  }

                  return (
                    <g key={id}>
                      {/* Region Polygon */}
                      <path
                        d={path}
                        tabIndex={isSupported && !selectedRegion ? 0 : -1}
                        role="button"
                        aria-label={`Région ${regionName}`}
                        onMouseEnter={() => !selectedRegion && setHoveredRegion(regionKey)}
                        onMouseLeave={() => !selectedRegion && setHoveredRegion(null)}
                        onClick={() => !selectedRegion && handleRegionClick(regionKey)}
                        onKeyDown={(e) => {
                          if (
                            (e.key === 'Enter' || e.key === ' ') &&
                            isSupported &&
                            !selectedRegion
                          ) {
                            e.preventDefault();
                            handleRegionClick(regionKey);
                          }
                        }}
                        className={`transition-all duration-300 outline-none ${fillClass} ${strokeClass} ${cursorClass}`}
                        vectorEffect="non-scaling-stroke"
                      />

                    </g>
                  );
                })}
              </g>}

              {/* ========================================================================= */}
              {/* LEVEL 2: REAL ADMINISTRATIVE SUBDIVISIONS LAYER (Inside Selected Region)   */}
              {/* ========================================================================= */}
              {selectedRegion && (
                <g className="selected-region-layer">
                  {/* One fill-only backdrop; the outer boundary is drawn exactly once below. */}
                  <path
                    d={processedRegions.find((region) => region.regionKey === selectedRegion)?.path || ''}
                    className="fill-brand-blue/5 dark:fill-brand-blue/10 pointer-events-none"
                    stroke="none"
                  />
                  <g className="subdivisions-layer">
                  {currentSubdivisions.map((subdiv) => {
                    const isSupported = !!subdiv.verifiedCity;
                    const isHovered = hoveredSubdivision === subdiv.shapeName;
                    const isSelected = selectedSubdivision === subdiv.shapeName;

                    const cityName = subdiv.verifiedCity
                      ? locale === 'ar'
                        ? subdiv.verifiedCity.nameAr
                        : subdiv.verifiedCity.nameFr
                      : subdiv.shapeName;

                    // Subdivision styling
                    let subdivFill = 'fill-slate-100/70 dark:fill-slate-800/40';
                    let subdivStroke =
                      'stroke-slate-300/80 dark:stroke-slate-700/70 stroke-[0.75]';
                    let subdivCursor = isSupported ? 'cursor-pointer' : 'cursor-default';

                    if (isSupported) {
                      subdivFill = 'fill-brand-blue/15 dark:fill-brand-blue/20';
                      subdivStroke =
                        'stroke-brand-blue/45 dark:stroke-blue-400/45 stroke-[1]';

                      if (isSelected) {
                        subdivFill = 'fill-brand-blue/35 dark:fill-brand-blue/45';
                        subdivStroke =
                          'stroke-brand-blue dark:stroke-blue-400 stroke-[1.5]';
                      } else if (isHovered) {
                        subdivFill = 'fill-brand-blue/25 dark:fill-brand-blue/35';
                        subdivStroke =
                          'stroke-brand-blue dark:stroke-blue-400 stroke-[1.35]';
                      }
                    }

                    return (
                      <g key={subdiv.id}>
                        {/* Real Subdivision Polygon */}
                        <path
                          d={subdiv.path}
                          tabIndex={isSupported ? 0 : -1}
                          role="button"
                          aria-label={`Subdivision ${cityName}`}
                          onMouseEnter={() => setHoveredSubdivision(subdiv.shapeName)}
                          onMouseLeave={() => setHoveredSubdivision(null)}
                          onClick={() => handleSubdivisionClick(subdiv)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && isSupported) {
                              e.preventDefault();
                              handleSubdivisionClick(subdiv);
                            }
                          }}
                          className={`transition-all duration-200 outline-none ${subdivFill} ${subdivStroke} ${subdivCursor}`}
                          vectorEffect="non-scaling-stroke"
                        />

                      </g>
                    );
                  })}
                  </g>
                  <path
                    d={processedRegions.find((region) => region.regionKey === selectedRegion)?.path || ''}
                    fill="none"
                    className="stroke-brand-blue/70 dark:stroke-blue-400/70 pointer-events-none"
                    strokeWidth={1.35}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
            </svg>

            {/* Labels live in viewport pixels, outside the zoomed geometry SVG. */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
              viewBox={`0 0 ${Math.max(1, viewport.width)} ${Math.max(1, viewport.height)}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {labelLayout.map((label) => (
                <text
                  key={label.id}
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  direction={isRTL ? 'rtl' : 'ltr'}
                  unicodeBidi="plaintext"
                  fontSize={label.fontSize}
                  fontWeight={label.hovered || label.selected ? 600 : label.active ? 550 : 500}
                  className={label.hovered || label.selected || label.active
                    ? 'fill-brand-blue dark:fill-blue-300'
                    : 'fill-slate-400 dark:fill-slate-500'}
                  style={{ paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.9)', strokeWidth: 1.5 }}
                >
                  {label.lines.map((line, index) => (
                    <tspan
                      key={`${label.id}-${index}`}
                      x={label.x}
                      dy={index === 0 ? `${-(label.lines.length - 1) * 0.54}em` : '1.08em'}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              ))}
            </svg>

            {/* ========================================================================= */}
            {/* INTERACTIVE TOOLTIPS                                                      */}
            {/* ========================================================================= */}

            {/* Level 1 Tooltip (Hovering a region in full Morocco view) */}
            {!selectedRegion && hoveredRegion && (
              <div
                className="absolute pointer-events-none z-30 transition-opacity duration-200 ease-out"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 p-3.5 sm:p-4 rounded-2xl shadow-xl min-w-[200px] sm:min-w-[220px]">
                  {supportedRegions.has(hoveredRegion) ? (
                    <>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1">
                        {REGIONS_TRANSLATIONS[hoveredRegion]
                          ? locale === 'ar'
                            ? REGIONS_TRANSLATIONS[hoveredRegion].nameAr
                            : REGIONS_TRANSLATIONS[hoveredRegion].nameFr
                          : hoveredRegion}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-brand-blue font-semibold mb-2">
                        {locale === 'ar' ? 'المدن المتوفرة' : 'Villes disponibles'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {citiesByRegion.get(hoveredRegion)?.map((c) => (
                          <span
                            key={c.id}
                            className="text-[9px] sm:text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-medium border border-slate-100 dark:border-slate-700"
                          >
                            {locale === 'ar' ? c.nameAr : c.nameFr}
                          </span>
                        ))}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-brand-blue/70 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-medium">
                        <span>{locale === 'ar' ? 'انقر لتكبير المنطقة' : 'Cliquez pour explorer'}</span>
                        <ArrowIcon className="w-3 h-3" />
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1">
                        {REGIONS_TRANSLATIONS[hoveredRegion]
                          ? locale === 'ar'
                            ? REGIONS_TRANSLATIONS[hoveredRegion].nameAr
                            : REGIONS_TRANSLATIONS[hoveredRegion].nameFr
                          : hoveredRegion}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-amber-500 font-semibold mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {locale === 'ar' ? 'تغطية قادمة' : 'Couverture à venir'}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {locale === 'ar'
                          ? 'هذه المنطقة غير متوفرة بعد في MaisonDeLUX. نحن نوسع تغطيتنا تدريجياً.'
                          : 'Cette région n’est pas encore disponible dans MaisonDeLUX. Nous étendons progressivement notre couverture territoriale.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Level 2 Tooltip (Hovering a subdivision in selected region view) */}
            {selectedRegion && hoveredSubdivision && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 transition-opacity duration-200"
              >
                {(() => {
                  const sub = currentSubdivisions.find((s) => s.shapeName === hoveredSubdivision);
                  if (!sub) return null;

                  return (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {sub.verifiedCity
                            ? locale === 'ar'
                              ? sub.verifiedCity.nameAr
                              : sub.verifiedCity.nameFr
                            : sub.shapeName}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {sub.verifiedCity
                            ? locale === 'ar'
                              ? 'مدينة مغطاة — انقر للتقدير الفوري'
                              : 'Ville couverte — Cliquez pour estimer'
                            : locale === 'ar'
                            ? 'إقليم / عمالة خارج نطاق التغطية الحالية'
                            : 'Subdivision administrative hors couverture'}
                        </p>
                      </div>
                      {sub.verifiedCity && (
                        <div className="w-6 h-6 rounded-full bg-brand-blue/10 dark:bg-blue-400/20 flex items-center justify-center text-brand-blue dark:text-blue-400">
                          <ArrowIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
