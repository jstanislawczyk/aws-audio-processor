import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <input type="file" accept=".mp3,audio/*" />
      </main>
    </div>
  );
}
