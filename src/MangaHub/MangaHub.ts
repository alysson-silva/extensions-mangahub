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

export class MangaHub extends Source {
  get author(): string {
    return "Alysson Souza e Silva";
  }

  get description(): string {
    return "MangaHub.io extension";
  }

  getChapterDetails(data: any, metadata: any): ChapterDetails {
    const chapterDetail = data.data.chapter;

    return createChapterDetails({
      id: metadata.chapterId,
      longStrip: chapterDetail.manga.isWebtoon,
      mangaId: metadata.mangaId,
      pages: JSON.parse(chapterDetail.pages),
    });
  }

  getChapterDetailsRequest(mangaId: string, chapId: string): Request {
    return createRequestObject({
      url: "https://api.mghubcdn.com/graphql",
      method: "POST",
      metadata: { mangaId: mangaId, chapterId: chapId },
      data: {
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
      },
    });
  }

  getChapters(data: any, metadata: any): Chapter[] {
    let chapters: Chapter[] = [];

    for (const c of data.data.manga.chapters) {
      chapters.push(
        createChapter({
          chapNum: c.number.toString(),
          id: c.number.toString(),
          langCode: LanguageCode.ENGLISH,
          mangaId: metadata.id,
          name: c.title,
          time: c.date,
        })
      );
    }

    return chapters;
  }

  getChaptersRequest(mangaId: string): Request {
    return createRequestObject({
      url: "https://api.mghubcdn.com/graphql",
      method: "POST",
      metadata: { id: mangaId },
      data: {
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
      },
    });
  }

  getMangaDetails(data: any, metadata: any): Manga[] {
    let mangas: Manga[] = [];
    let manga = data.data.manga;
    let genres = (manga.genres.split(", ") as string[]).map((g) => createTag({ id: g, label: g }));

    mangas.push(
      createManga({
        titles: manga.title,
        artist: manga.artist,
        author: manga.author,
        hentai: manga.isYaoi || manga.isPorn || manga.isSoftPorn,
        id: metadata.id,
        image: this.websiteBaseURL + "/" + manga.image,
        rating: 0,
        status: manga.status == "ongoing" ? MangaStatus.ONGOING : MangaStatus.COMPLETED,
        tags: [createTagSection({ id: "1", label: "genres", tags: genres })],
        desc: manga.description,
        lastUpdate: manga.updatedDate,
      })
    );

    return mangas;
  }

  getMangaDetailsRequest(ids: string[]): Request[] {
    let requests: Request[] = [];

    for (let id of ids) {
      requests.push(
        createRequestObject({
          url: "https://api.mghubcdn.com/graphql",
          method: "POST",
          metadata: { id: id },
          data: {
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
          },
        })
      );
    }

    return requests;
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

  search(data: any, metadata: any): PagedResults | null {
    const rows = data.data.search.rows;

    let mangas = [];
    for (let row of rows) {
      mangas.push(
        createMangaTile({
          id: row.slug,
          image: this.websiteBaseURL + "/" + row.image,
          title: row.title,
        })
      );
    }

    return createPagedResults({
      results: mangas,
      nextPage: undefined,
    });
  }

  searchRequest(query: SearchRequest): Request | null {
    return createRequestObject({
      url: "https://api.mghubcdn.com/graphql",
      method: "POST",
      data: {
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
      },
    });
  }

  get version(): string {
    return "1.1";
  }

  get websiteBaseURL(): string {
    return "https://mangahub.io";
  }

  getHomePageSectionRequest(): HomeSectionRequest[] | null {
    return [
      createHomeSectionRequest({
        request: createRequestObject({
          url: "https://api.mghubcdn.com/graphql",
          method: "POST",
          data: {
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
          },
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
    let mangas = data.data.latestPopular;

    var tiles: MangaTile[] = [];
    for (let manga of mangas) {
      tiles.push(
        createMangaTile({
          id: manga.id,
          title: manga.title,
          image: this.websiteBaseURL + "/" + manga.image,
        })
      );
    }
    section[0].items = tiles;

    return section;
  }
}
