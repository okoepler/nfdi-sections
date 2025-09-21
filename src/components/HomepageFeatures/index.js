import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const firstRow = [
  {
    title: 'Section Ethical, Legal and Social Aspects (ELSA)',
    img: require('@site/static/img/Icon-section-ELSA.png').default,
    alt: 'Section Ethical, Legal and Social Aspects (ELSA)',
  },
  {
    title: 'Section Common Infrastructure (INFRA)',
    img: require('@site/static/img/Icon-section-infra.png').default,
    alt: 'Section Common Infrastructure (INFRA)',
  },
  {
    title: 'Meta',
    img: require('@site/static/img/Icon-section-meta.png').default,
    alt: 'Meta section',
  },
];

const secondRow = [
  {
    title: 'Education & Training',
    img: require('@site/static/img/Icon-section-edutrain.png').default,
    alt: 'Education and Training section',
  },
  {
    title: 'Industry',
    img: require('@site/static/img/Icon-section-industry.png').default,
    alt: 'Industry section',
  },
  {
    title: 'Section Internationalisation',
    img: require('@site/static/img/undraw_docusaurus_react.svg').default,
    alt: 'Section Internationalisation',
  },
];

function Card({title, img, alt}) {
  return (
    <div className={clsx('col col--4', styles.cardCol)}>
      <div className={clsx('text--center', styles.card)}>
        {/* Image */}
        <img src={img} alt={alt} className={styles.cardImg} />
        {/* Text */}
        <Heading as="h3" className={styles.cardTitle}>{title}</Heading>
        <p className={styles.cardText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
          posuere erat a ante.
        </p>
        <Link className={styles.cardLink} to="#">
          Section docs (coming soon)
        </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {firstRow.map((props, idx) => (
            <Card key={`row1-${idx}`} {...props} />
          ))}
        </div>
        <div className="row">
          {secondRow.map((props, idx) => (
            <Card key={`row2-${idx}`} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
