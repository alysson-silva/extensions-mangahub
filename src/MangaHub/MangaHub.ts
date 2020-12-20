import {
  Chapter,
  ChapterDetails,
  HomeSection,
  HomeSectionRequest,
  LanguageCode,
  Manga,
  MangaStatus,
  MangaTile,
  PagedResults,
  Request,
  SearchRequest,
  Source,
} from "paperback-extensions-common";

const MANGAHUB_URL = "https://mangahub.io";
const MANGAHUB_API = "https://api.mghubcdn.com/graphql";
const MANGAHUB_CDN = "https://thumb.mghubcdn.com";
const MANGAHUB_CDN2 = "https://img.mghubcdn.com/file/imghub";

export class MangaHub extends Source {
  get version(): string {
    return new Date().getTime().toString();
  }

  get author(): string {
    return "Alysson Souza e Silva";
  }

  get authorWebsite(): string {
    return "https://github.com/alysson-silva/paperback-extensions";
  }

  get description(): string {
    return "MangaHub.io extension";
  }

  get hentaiSource(): boolean {
    return false;
  }

  get icon(): string {
    return "icon.png";
  }

  get name(): string {
    return "MangaHub";
  }

  get websiteBaseURL(): string {
    return MANGAHUB_URL;
  }

  private static buildUrl(base: string, path: any) {
    return `${base}/${path}`;
  }

  getChapterDetails(data: any, metadata: any): ChapterDetails {
    console.log(
      "========== getChapterDetails:" +
        "data:" +
        JSON.stringify(data) +
        "metadata:" +
        JSON.stringify(metadata)
    );

    let parsedData = JSON.parse(data);

    if (parsedData?.data?.chapter == null) {
      throw "Found no chapter details.";
    }

    const chapterDetail = parsedData.data.chapter;

    return createChapterDetails({
      id: metadata.chapterId,
      longStrip: chapterDetail.manga.isWebtoon,
      mangaId: metadata.mangaId,
      pages: Object.values(JSON.parse(chapterDetail.pages)).map((path) =>
        MangaHub.buildUrl(MANGAHUB_CDN2, path)
      ),
    });
  }

  getChapterDetailsRequest(mangaId: string, chapId: string): Request {
    console.log(
      "========== getChapterDetailsRequest:" +
        "mangaId:" +
        mangaId +
        "chapId" +
        chapId
    );

    return createRequestObject({
      url: MANGAHUB_API,
      method: "POST",
      metadata: { mangaId: mangaId, chapterId: chapId },
      headers: {
        "content-type": "application/json",
      },
      data: JSON.stringify({
        query: `
        {
            chapter(x: m01, slug: "${mangaId}", number: ${chapId}) {
              id
              title
              mangaID
              number
              date
              pages
              manga {
                isWebtoon
              }
            }
          }`,
      }),
    });
  }

  getChapters(data: any, metadata: any): Chapter[] {
    console.log(
      "========== getChapters:" +
        "data:" +
        JSON.stringify(data) +
        "metadata:" +
        JSON.stringify(metadata)
    );

    let parsedData = JSON.parse(data);

    if (parsedData?.data?.manga?.chapters == null) {
      return [];
    }

    return parsedData.data.manga.chapters.map((chapter: any) => {
      return createChapter({
        chapNum: chapter.number,
        id: chapter.number,
        langCode: LanguageCode.ENGLISH,
        mangaId: metadata.id,
        name: chapter.title,
        time: chapter.date,
      });
    });
  }

  getChaptersRequest(mangaId: string): Request {
    console.log("========== getChaptersRequest:" + "mangaId:" + mangaId);

    return createRequestObject({
      url: MANGAHUB_API,
      method: "POST",
      metadata: { id: mangaId },
      headers: {
        "content-type": "application/json",
      },
      data: JSON.stringify({
        query: `
        {
            manga(x: m01, slug: "${mangaId}") {
              chapters {
                id
                number
                title
                slug
                date
              }
            }
          }`,
      }),
    });
  }

  getMangaDetails(data: any, metadata: any): Manga[] {
    console.log(
      "========== getMangaDetails:" +
        "data:" +
        JSON.stringify(data) +
        "metadata:" +
        JSON.stringify(metadata)
    );

    let parsedData = JSON.parse(data);

    if (parsedData?.data?.manga == null) {
      return [];
    }

    let mangas: Manga[] = [];
    let manga = parsedData.data.manga;
    let genres = (manga.genres.split(", ") as string[]).map((g) =>
      createTag({ id: g, label: g })
    );

    mangas.push(
      createManga({
        titles: manga.title,
        artist: manga.artist,
        author: manga.author,
        hentai: manga.isYaoi || manga.isPorn || manga.isSoftPorn,
        id: metadata.id,
        image: MangaHub.buildUrl(MANGAHUB_CDN, manga.image),
        rating: 0,
        status:
          manga.status == "ongoing"
            ? MangaStatus.ONGOING
            : MangaStatus.COMPLETED,
        tags: [createTagSection({ id: "1", label: "genres", tags: genres })],
        desc: manga.description,
        lastUpdate: manga.updatedDate,
      })
    );

    return mangas;
  }

  getMangaDetailsRequest(ids: string[]): Request[] {
    console.log(
      "========== getMangaDetailsRequest:" + "ids:" + JSON.stringify(ids)
    );

    return ids.map((id) =>
      createRequestObject({
        url: MANGAHUB_API,
        method: "POST",
        metadata: { id: id },
        data: JSON.stringify({
          query: `
            {
                manga(x: m01, slug: "${id}") {
                  id
                  title
                  slug
                  status
                  image
                  author
                  artist
                  genres
                  description
                  isYaoi
                  isPorn
                  isSoftPorn
                  updatedDate
                }
            }`,
        }),
      })
    );
  }

  search(data: any, metadata: any): PagedResults | null {
    console.log(
      "==========  search:" +
        "data:" +
        JSON.stringify(data) +
        "metadata:" +
        JSON.stringify(metadata)
    );

    let parsedData = JSON.parse(data);

    if (parsedData?.data?.search?.rows == null) {
      return null;
    }

    return createPagedResults({
      results: parsedData.data.search.rows.map((r: any) => {
        return createMangaTile({
          id: r.slug,
          image: MangaHub.buildUrl(MANGAHUB_CDN, r.image),
          title: createIconText(r.title),
        });
      }),
    });
  }

  searchRequest(query: SearchRequest): Request | null {
    if (query.title == null) {
      return null;
    }

    return createRequestObject({
      url: MANGAHUB_API,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      data: JSON.stringify({
        query: `
        {
            search(x: m01, q: "${query.title}", genre: "all", mod: POPULAR, count: true, offset: 0) {
              rows {
                id
                title
                slug
                status
                author
                genres
                image
                latestChapter
              }
              count
            }
          }`,
      }),
    });
  }

  getHomePageSectionRequest(): HomeSectionRequest[] | null {
    return [
      createHomeSectionRequest({
        request: createRequestObject({
          url: MANGAHUB_API,
          method: "POST",
          data: JSON.stringify({
            query: `
            {
                latestPopular(x: m01) {
                  id
                  title
                  slug
                  image
                  latestChapter
                  updatedDate
                }
            }`,
          }),
        }),
        sections: [
          createHomeSection({
            id: "latest_manga",
            title: "Latest",
          }),
        ],
      }),
    ];
  }

  getHomePageSections(data: any, section: HomeSection[]): HomeSection[] | null {
    console.log(
      "==========  getHomePageSections:" +
        "data:" +
        JSON.stringify(data) +
        "section:" +
        JSON.stringify(section)
    );

    let parsedData = JSON.parse(data);

    if (parsedData?.data?.latestPopular) {
      return null;
    }

    let mangas = parsedData.data.latestPopular;

    const tiles: MangaTile[] = [];
    for (let manga of mangas) {
      tiles.push(
        createMangaTile({
          id: manga.id,
          title: manga.title,
          image: MangaHub.buildUrl(MANGAHUB_CDN, manga.image),
        })
      );
    }
    section[0].items = tiles;

    return section;
  }
}
