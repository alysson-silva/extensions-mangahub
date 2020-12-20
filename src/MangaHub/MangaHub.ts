import {
    Chapter,
    ChapterDetails,
    LanguageCode,
    Manga,
    MangaStatus,
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
        return "";
    }

    getChapterDetails(data: any, metadata: any): ChapterDetails {
        const chapterDetail = data.data.chapter;

        return createChapterDetails({
            id: metadata.chapterId,
            longStrip: chapterDetail.manga.isWebtoon,
            mangaId: metadata.mangaId,
            pages: JSON.parse(chapterDetail.pages)
        })
    }

    getChapterDetailsRequest(mangaId: string, chapId: string): Request {
        return createRequestObject({
            url: "https://api.mghubcdn.com/graphql",
            method: "POST",
            metadata: {mangaId: mangaId, chapterId: chapId},
            data: {
                query: `{chapter(x:m01,slug:"${mangaId}",number:${chapId}){id,title,mangaID,number,date,pages,manga{isWebtoon}}}`,
            },
        })
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
                    time: c.date
                }))
        }

        return chapters;
    }

    getChaptersRequest(mangaId: string): Request {
        return createRequestObject({
            url: "https://api.mghubcdn.com/graphql",
            method: "POST",
            metadata: {id: mangaId},
            data: {
                query: `{manga(x:m01,slug:"${mangaId}"){chapters{id,number,title,slug,date}}}`,
            },
        })
    }

    getMangaDetails(data: any, metadata: any): Manga[] {
        let mangas: Manga[] = [];
        let manga = data.data.manga;
        let genres = (manga.genres.split(', ') as string[]).map(g => createTag({id: g, label: g}));

        mangas.push(createManga({
            titles: manga.title,
            artist: manga.artist,
            author: manga.author,
            hentai: manga.isYaoi || manga.isPorn || manga.isSoftPorn,
            id: metadata.id,
            image: this.websiteBaseURL + '/' + manga.image,
            rating: 0,
            status: manga.status == 'ongoing' ? MangaStatus.ONGOING : MangaStatus.COMPLETED,
            tags: [createTagSection({id: '1', label: 'genres', tags: genres})],
            desc: manga.description,
            lastUpdate: manga.updatedDate
        }))

        return mangas;
    }

    getMangaDetailsRequest(ids: string[]): Request[] {
        let requests: Request[] = [];

        for (let id of ids) {
            requests.push(
                createRequestObject({
                    url: "https://api.mghubcdn.com/graphql",
                    method: "POST",
                    metadata: {id: id},
                    data: {
                        query: `{manga(x:m01,slug:"${id}"){id,rank,title,slug,status,image,latestChapter,author,artist,genres,description,alternativeTitle,mainSlug,isYaoi,isPorn,isSoftPorn,unauthFile,noCoverAd,isLicensed,createdDate,updatedDate,chapters{id,number,title,slug,date}}}`,
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
        var rows = data.data.search.rows;

        let mangas = [];
        for (let row of rows) {
            mangas.push(createMangaTile({
                id: row.slug, image: this.websiteBaseURL + '/' + row.image, title: row.title
            }))
        }

        return createPagedResults({
            results: mangas,
            nextPage: undefined
        })
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
                          rank
                          title
                          slug
                          status
                          author
                          genres
                          image
                          latestChapter
                          unauthFile
                          createdDate
                        }
                        count
                      }
                    }           
                `,
            },
        })
    }

    get version(): string {
        return "1.0";
    }

    get websiteBaseURL(): string {
        return "https://mangahub.io";
    }
}
