import cheerio from "cheerio";
import { MangaHub } from "../MangaHub/MangaHub";
import { APIWrapper, MangaStatus, Source } from "paperback-extensions-common";

describe("MangaHub Tests", function () {
  var wrapper: APIWrapper = new APIWrapper();
  var source: Source = new MangaHub(cheerio);
  var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);

  /**
   * The Manga ID which this unit test uses to base it's details off of.
   * Try to choose a manga which is updated frequently, so that the historical checking test can
   * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
   */
  var mangaId = "red-storm_123";

  it("Retrieve Manga Details", async () => {
    let details = await wrapper.getMangaDetails(source, [mangaId]);
    expect(
      details,
      "No results found with test-defined ID [" + mangaId + "]"
    ).to.be.an("array");
    expect(details).to.not.have.lengthOf(0, "Empty response from server");

    // Validate that the fields are filled
    let data = details[0];
    expect(data.id, "Missing ID").to.equal("red-storm_123");
    expect(data.image, "Missing Image").to.equal(
      "https://thumb.mghubcdn.com/mn/red-storm.jpg"
    );
    expect(data.status, "Missing Status").to.equal(MangaStatus.ONGOING);
    expect(data.author, "Missing Author").to.equal("Cyungchan Noh");
    expect(data.desc, "Missing Description").to.not.be.empty;
    expect(data.titles, "Missing Titles").to.equal("Red Storm");
  });

  it("Get Chapters", async () => {
    let data = await wrapper.getChapters(source, mangaId);

    expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;

    let entry = data[0];
    expect(entry.id, "No ID present").to.be.gte(0);
    expect(entry.time, "No date present").to.not.be.empty;
    expect(entry.name, "No title available").to.not.be.empty;
    expect(entry.chapNum, "No chapter number present").to.be.gte(0);
  });

  it("Get Chapter Details", async () => {
    let chapters = await wrapper.getChapters(source, mangaId);
    let data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);

    expect(data, "No server response").to.exist;
    expect(data, "Empty server response").to.not.be.empty;

    expect(data.id, "Missing ID").to.be.gte(0);
    expect(data.mangaId, "Missing MangaID").to.be.not.empty;
    expect(data.pages, "No pages present").to.be.not.empty;
  });

  it("Testing search", async () => {
    let testSearch = createSearchRequest({
      title: "red storm",
    });

    let search = await wrapper.search(source, testSearch, 1);
    let result = search[0];

    expect(result, "No response from server").to.exist;

    expect(result.id, "No ID found for search query").to.equal("red-storm_123");
    expect(result.image, "No image found for search").to.equal(
      "https://thumb.mghubcdn.com/mn/red-storm.jpg"
    );
    expect(result.title, "No title").to.equal("Red Storm");
  });

  it("Testing Home-Page aquisition", async () => {
    let homePages = await wrapper.getHomePageSections(source);
    expect(homePages, "No response from server").to.be.not.null;
  });
});
