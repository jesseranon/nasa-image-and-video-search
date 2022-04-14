//The user will enter a date. Use that date to get the NASA picture of the day from that date! https://api.nasa.gov/
const BASE_URL = 'https://images-api.nasa.gov';
let searchField = document.querySelector('#search');
let resultsNum = 10;
const searches = {};
let items;

document.querySelector('.close').addEventListener('click', hideOverlay);

document.querySelector('.get-pic').addEventListener('click', async e => {
    e.preventDefault();
    const keyword = searchField.value;
    let data = await createSearch(keyword);
    console.log(data);
    await data.createSnapshots(resultsNum);
    data.displaySnapshots();
});

async function getPod(url = `${BASE_URL}/search?q=apollo`) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        // console.log(data)
        return data;
    } catch (error) {
        document.querySelector('.cards').innerText = `This search was unsuccessful: <span="error">${error}</span>`;
    }
}

async function createSearch(searchTerm) {
    let data = await getPod(`${BASE_URL}/search?q=${searchTerm}`);
    if (!(`${searchTerm}` in searches)) searches[searchTerm] = new Search(data);
    console.log(`searches object`, searches);
    return searches[searchTerm];
}

function hideOverlay() {
    const overlay = document.querySelector('.overlay');
    overlay.classList.add('hidden');
    let tags = ['h2', '.media', '.date-created', '.description'];
    tags.forEach(t => {
        document.querySelector(t).innerHTML = '';
    });

}

class Search {
    constructor(obj) {
        this.searchTerm = obj.collection.href.split('=')[1];
        this.items = obj.collection.items;
        this.snapshots = [];
        this.pagination = {};
    }

    async createSnapshots(num) {
        for (let i = 1; i <= num; i++) {
            const snapshot = new NasaSnapshot(this.items[i]);
            this.snapshots.push(new NasaSnapshot(this.items[i]));
        }
        for await (const snapshot of this.snapshots) {
            if (!snapshot.media) await snapshot.setMedia();
            if (!snapshot.thumb) await snapshot.setThumb();
        }
    }

    displaySnapshots() {
        document.querySelector('.cards').innerHTML = '';
        this.snapshots.forEach(snapshot => {
            snapshot.renderCard();
        });
        Array.from(document.querySelectorAll('.card')).forEach(card => {
            card.addEventListener('click', e => {
                this.renderOverlay(e.currentTarget.id);
            });
        });
        this.setPagination(resultsNum);
        this.renderPaginationLinks();
    }

    renderOverlay(str) {
        const overlay = document.querySelector('.overlay');
        const snapshot = this.snapshots.filter(s => {
            return s.id === str;
        })[0];
        const media = overlay.querySelector('.media');
        overlay.querySelector('h2').innerText = snapshot.title;
        overlay.querySelector('.date-created').innerText = snapshot.dateCreated;
        overlay.querySelector('.description').innerText = snapshot.description;
        if (snapshot.media_type === 'video') {
            media.innerHTML = `
            <video src="${snapshot.media}" autoplay controls></video>
            `;
        } else {
            media.innerHTML = `
            <img src="${snapshot.media}" alt="${snapshot.description}">
            `;
        }
        overlay.classList.remove('hidden');
    }

    setPagination(num) {
        const pages = Math.ceil(this.items.length / num);
        for (let i = 0; i < pages; i++) {
            this.pagination[i + 1] = [(num * i), (((num * i) + num - 1) > this.items.length) ? this.items.length : (num * i) + num - 1];
        }
    }

    renderPaginationLinks() {
        let paginationUl = document.querySelector('.pagination');
        paginationUl.innerHTML = '';
        let nums = Object.keys(this.pagination);
        for (const n of nums) {
            paginationUl.innerHTML += `<li><a href="#">${n}</a></li>`;
        }
        Array.from(document.querySelectorAll('.pagination a')).forEach(a => {
            a.addEventListener('click', e => console.log(e.currentTarget.innerText));
        })
    }
}

class NasaSnapshot {
    constructor(obj) {
        this.title = obj.data[0].title;
        this.id = `${obj.data[0].nasa_id}_${this.title}`;
        this.media_type = obj.data[0].media_type;
        this.description = obj.data[0].description;
        this.dateCreated = obj.data[0].date_created;
        this.href = obj.href;
        this.media = null;
        this.thumb = null;
    }

    async setMedia() {
        const data = await getPod(this.href);
        if (this.media_type === 'video') {
            this.media = data.filter(a => a.includes('~medium') && a.includes('.mp4'))[0];
        } else if (this.media_type === 'image') {
            const images = data.filter(a => a.includes('.jpg'));
            this.media = images[images.length - 1];
        }   
    }

    async setThumb() {
        const data = await getPod(this.href);
        const thumbs = data.filter(link => link.includes('~thumb') && link.includes('.jpg'))
        this.thumb = thumbs[thumbs.length - 1];
    }

    renderCard() {
        let res = `<li>
            <div class="card" id="${this.id}">
                <img class="thumbnail" src="${this.thumb}">
                <span class="card-title">${this.title}</span>
            </div>
        </li>`;
        document.querySelector('#cards').innerHTML += res;
    }

}