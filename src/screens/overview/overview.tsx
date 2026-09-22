import { Container } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { Baby } from 'lucide-react';
import Header from "../../components/header/header";
import DataAttribution from '../../components/weather/dataAttribution';
import { getOutfit } from "../../model/clothesDeterminer/clothesDeterminer";
import type { ClothesItem } from "../../model/clothesDeterminer/clothesDeterminer";
import { useChildrenQuery } from "../../hooks/api/useChildrenQuery";
import { useWeather } from "../../hooks/useWeather";
import { useLocation } from "../../hooks/useLocation";
import { kelvinToCelsius } from "../../model/temperature/temperature";
import type { HourlyWeather } from "../../weatherApiClient";
import type { Child } from "../../model/child/child";
import styles from "./overview.module.scss";

const boyAvatar = 'assets/img/boy.png';
const girlAvatar = 'assets/img/girl.png';

// ať i minimum něco ukáže
const BAR_FLOOR = 30;

function toCelsius(kelvin: number): number {
    return Math.round(kelvinToCelsius(kelvin));
}

function formatHour(dt: number): string {
    return `${new Date(dt * 1000).getHours()}:00`;
}

function formatNames(children: Child[]): string {
    const names = children.map(c => c.name).filter(Boolean);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}


// Přes den se počasí mění, tak sbalím, co dítě potřebuje pro nejchladnější
// i nejteplejší chvíli (teplé vrstvy na ráno, lehčí na odpoledne).
function packForToday(child: Child, feelsMin: number, feelsMax: number): ClothesItem[] {
    const atMin = getOutfit(feelsMin, child.age, child.sex);
    const atMax = getOutfit(feelsMax, child.age, child.sex);
    const byName = new Map<string, ClothesItem>();
    for (const item of [...atMin, ...atMax]) {
        if (!byName.has(item.name)) {
            byName.set(item.name, item);
        }
    }
    return [...byName.values()];
}

const Skeleton = () => (
    <>
        <div className={styles.tiles} aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonTile}`} />
            ))}
        </div>
        <div className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
            <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%' }} />
            <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
        </div>
        <p className={styles.visuallyHidden} role="status">Loading overview…</p>
    </>
);

const Overview = () => {
    const { coords } = useLocation();
    const { weather, loading: weatherLoading, error: weatherError } = useWeather(coords);
    const { data: children, isPending: childrenLoading, isError: childrenError } = useChildrenQuery();

    return (
        <>
            <Header />
            <Container>
                <div className={styles.pageHead}>
                    <h1>Overview</h1>
                    <p>Everything for today, at a glance.</p>
                </div>

                {weatherLoading || childrenLoading ? (
                    <Skeleton />
                ) : weatherError || weather === null ? (
                    <div className={styles.alert} role="alert">
                        Could not load weather. Check your connection and try again.
                    </div>
                ) : (
                    <OverviewContent
                        hourly={weather.hourly}
                        kids={children ?? []}
                        childrenError={childrenError ? 'Could not load children. Check your connection and try again.' : null}
                    />
                )}
                <DataAttribution />
            </Container>
        </>
    );
};

interface OverviewContentProps {
    hourly: HourlyWeather[];
    kids: Child[];
    childrenError: string | null;
}

const OverviewContent = ({ hourly, kids, childrenError }: OverviewContentProps) => {
    const today = hourly.slice(0, 24);
    const chartHours = hourly.slice(0, 12);

    const temps = today.map(h => toCelsius(h.temp));
    const dayMin = Math.min(...temps);
    const dayMax = Math.max(...temps);

    // oblečení plánuju podle pocitové teploty
    const feels = today.map(h => toCelsius(h.feels_like));
    const feelsMin = Math.min(...feels);
    const feelsMax = Math.max(...feels);

    const nowTemp = toCelsius(hourly[0].temp);
    const nowDescription = hourly[0].weather[0]?.description ?? '';

    const coldest = today.reduce((coldestSoFar, hour) =>
        hour.temp < coldestSoFar.temp ? hour : coldestSoFar,
    today[0]);
    const feelsLikeColdest = toCelsius(coldest.feels_like);


    const chartTemps = chartHours.map(h => toCelsius(h.temp));
    const chartMin = Math.min(...chartTemps);
    const chartMax = Math.max(...chartTemps);
    const chartRange = chartMax - chartMin;
    const barHeight = (temp: number): number => {
        const ratio = chartRange === 0 ? 1 : (temp - chartMin) / chartRange;
        return Math.round(BAR_FLOOR + ratio * (100 - BAR_FLOOR));
    };

    const chartLabel =
        `Temperature over the next 12 hours: now ${nowTemp}°C, ` +
        `low ${chartMin}°C, high ${chartMax}°C.`;

    return (
        <>
            <section className={styles.tiles}>
                <div className={styles.tile}>
                    <span className={styles.label}>Kids</span>
                    <span className={styles.value}>{kids.length}</span>
                    <span className={styles.sub}>{formatNames(kids) || 'No children yet'}</span>
                </div>
                <div className={styles.tile}>
                    <span className={styles.label}>Now</span>
                    <span className={styles.value}>{nowTemp}<span className={styles.unit}>&deg;C</span></span>
                    <span className={styles.sub}>{nowDescription}</span>
                </div>
                <div className={styles.tile}>
                    <span className={styles.label}>Today</span>
                    <span className={styles.value}>{dayMin}&deg; / {dayMax}&deg;</span>
                    <span className={styles.sub}>Low / high</span>
                </div>
                <div className={`${styles.tile} ${styles.accent}`}>
                    <span className={styles.label}>Feels like</span>
                    <span className={styles.value}>{feelsLikeColdest}<span className={styles.unit}>&deg;C</span></span>
                    <span className={styles.sub}>Coldest at {formatHour(coldest.dt)}</span>
                </div>
            </section>

            <h2 className={styles.sectionTitle}>Temperature outlook</h2>
            <div className={styles.card}>
                <p className={styles.chartNote}>Next 12 hours — plan layers around the cold morning.</p>
                <div className={styles.chart} role="img" aria-label={chartLabel}>
                    {chartHours.map((hour, index) => {
                        const isNow = index === 0;
                        return (
                            <div
                                key={hour.dt}
                                className={`${styles.col} ${isNow ? styles.colNow : ''}`}
                            >
                                <span className={styles.temp}>{chartTemps[index]}&deg;</span>
                                <div
                                    className={`${styles.bar} ${isNow ? styles.barNow : ''}`}
                                    style={{ height: `${barHeight(chartTemps[index])}%` }}
                                />
                                <span className={styles.hour}>{isNow ? 'Now' : formatHour(hour.dt)}</span>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.legend}>
                    <span><span className={`${styles.swatch} ${styles.swatchNow}`} />Now</span>
                    <span><span className={`${styles.swatch} ${styles.swatchForecast}`} />Forecast</span>
                </div>
            </div>

            <h2 className={styles.sectionTitle}>What to pack today</h2>
            {childrenError ? (
                <div className={styles.alert} role="alert">{childrenError}</div>
            ) : kids.length === 0 ? (
                <div className={`${styles.card} ${styles.empty}`}>
                    <Baby className={styles.emptyIcon} size={40} strokeWidth={2} aria-hidden="true" />
                    <p>Add a child and we&apos;ll show today&apos;s dressing plan here.</p>
                    <Link to="/settings" className={styles.button}>Add child</Link>
                </div>
            ) : (
                <div className={styles.plan}>
                    {kids.map(child => {
                        const clothes = packForToday(child, feelsMin, feelsMax);
                        const avatar =
                            child.sex === 'male' ? boyAvatar :
                            child.sex === 'female' ? girlAvatar : '';
                        return (
                            <article key={child.id} className={styles.childCard}>
                                <div className={styles.childHead}>
                                    <img className={styles.avatar} src={avatar} alt="" />
                                    <div>
                                        <h3>{child.name}</h3>
                                        <div className={styles.meta}>
                                            {child.age} {child.age === 1 ? 'year' : 'years'}
                                        </div>
                                    </div>
                                </div>
                                <p className={styles.planHint}>
                                    Warm layers for the morning, lighter by afternoon &mdash; {clothes.length} items to have ready.
                                </p>
                                <ul className={styles.chips}>
                                    {clothes.map(item => (
                                        <li key={item.name} className={styles.chip}>
                                            <span className={styles.thumb}>
                                                <img src={item.imageUrl} alt="" />
                                            </span>
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default Overview;
