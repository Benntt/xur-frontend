const ENDPOINT = window.location.hostname.includes('github')
  ? 'https://xur-frontend-YOUR_NAME.vercel.app/api/xur' // ✏️ replace YOUR_NAME
  : '/api/xur';

async function load() {
  const res = await fetch(ENDPOINT);
  const { location, reset, items } = await res.json();
  document.getElementById('loc').textContent = `Xûr is at ${location} (reset ${new Date(reset).toLocaleString()})`;
  const ul = document.getElementById('inv');
  ul.innerHTML = items.map(it => `<li>Item hash: ${it.hash}</li>`).join('');
}
load();
setInterval(load, 5 * 60 * 1000);
