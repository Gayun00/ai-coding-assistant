import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

// Notion 클라이언트 설정
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function findDatabaseInPage() {
  try {
    const pageId = process.env.NOTION_PAGE_ID;
    if (!pageId) throw new Error("NOTION_PAGE_ID is not defined");

    console.log("🔄 페이지 내 데이터베이스 검색 중...");

    // 페이지 내의 블록들을 가져오기
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    // 데이터베이스 블록 찾기
    const databaseBlock = response.results.find(
      (block: any) => block.type === "child_database"
    );

    if (databaseBlock) {
      console.log("✅ 데이터베이스 찾음!");
      console.log("📚 데이터베이스 ID:", databaseBlock.id);

      // 데이터베이스의 페이지들 가져오기
      const pages = await getDatabasePages(databaseBlock.id);
      return pages;
    } else {
      console.log("❌ 페이지 내에서 데이터베이스를 찾을 수 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("❌ 에러:", error);
    throw error;
  }
}

async function getDatabasePages(databaseId: string) {
  try {
    console.log("📖 데이터베이스의 페이지들을 가져오는 중...");

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    console.log(`✨ ${response.results.length}개의 페이지를 찾았습니다!`);

    for (const page of response.results) {
      if ("properties" in page) {
        const pageObj = page as PageObjectResponse;

        // 디버깅을 위해 properties 출력
        console.log("Properties:", Object.keys(pageObj.properties));

        // 모든 프로퍼티 값 출력
        for (const [key, value] of Object.entries(pageObj.properties)) {
          console.log(`${key}:`, value);
        }

        // title 타입의 프로퍼티 찾기
        const titleProperty = Object.values(pageObj.properties).find(
          (prop) => prop.type === "title"
        );

        const pageTitle = titleProperty?.title?.[0]?.plain_text || "제목 없음";
        console.log(`\n📄 페이지: ${pageTitle}`);

        const content = await getPageContent(page.id);
        console.log(`내용 길이: ${content.length}자`);
      }
    }

    return response.results;
  } catch (error) {
    console.error("❌ 데이터베이스 조회 중 에러:", error);
    throw error;
  }
}

async function getPageContent(pageId: string) {
  try {
    console.log("🔄 페이지 내용을 가져오는 중...");

    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    console.log("✨ 페이지 구조:");
    response.results.forEach((block: any, index) => {
      console.log(`\n📌 블록 ${index + 1}:`);
      console.log("타입:", block.type);
      if (block[block.type]?.rich_text) {
        console.log(
          "텍스트:",
          block[block.type].rich_text
            .map((text: any) => text.plain_text)
            .join("")
        );
      }
    });

    return response.results;
  } catch (error) {
    console.error("❌ 에러:", error);
    throw error;
  }
}

async function getPageStructure() {
  try {
    const pageId = process.env.NOTION_PAGE_ID;
    if (!pageId) throw new Error("NOTION_PAGE_ID is not defined");

    console.log("🔄 페이지 구조를 분석하는 중...");

    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    console.log(`\n✨ 총 ${response.results.length}개의 블록을 찾았습니다!`);

    let index = 0;
    // 각 블록의 타입과 기본 정보 출력
    response.results.forEach((block: any) => {
      if (!block.paragraph?.rich_text?.[0]?.plain_text) return;
      index++;
      console.log(`\n📌 블록 ${index + 1}:`);
      console.log("타입:", block.type);

      // 블록 타입별로 다른 정보 출력
      switch (block.type) {
        case "paragraph":
          console.log(
            "텍스트:",
            block.paragraph?.rich_text?.[0]?.plain_text || "(빈 텍스트)"
          );
          break;
        case "heading_1":
          console.log("제목1:", block.heading_1?.rich_text?.[0]?.plain_text);
          break;
        case "heading_2":
          console.log("제목2:", block.heading_2?.rich_text?.[0]?.plain_text);
          break;
        case "child_page":
          console.log("하위페이지 제목:", block.child_page?.title);
          console.log("하위페이지 ID:", block.id);
          break;
        default:
          console.log("기타 블록 정보:", block);
      }
    });
    index = 0;

    return response.results;
  } catch (error) {
    console.error("❌ 에러:", error);
    throw error;
  }
}

async function getAllPagesContent() {
  try {
    const pageId = process.env.NOTION_PAGE_ID;
    if (!pageId) throw new Error("NOTION_PAGE_ID is not defined");

    console.log("🔄 페이지 분석 중...");

    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    const childPages = response.results.filter(
      (block: any) => block.type === "child_page"
    );

    console.log(`\n📚 ${childPages.length}개의 하위 페이지를 찾았습니다!`);

    const pagesContent = [];

    // 각 하위 페이지의 내용 가져오기
    for (const page of childPages) {
      const title = (page as any).child_page?.title || "제목 없음";
      console.log(`\n📄 페이지 "${title}" 내용 가져오는 중...`);

      const content = await getPageContent(page.id);

      pagesContent.push({
        title: title,
        content: content,
        pageId: page.id,
      });
    }

    return pagesContent;
  } catch (error) {
    console.error("❌ 에러:", error);
    throw error;
  }
}

// 실행
findDatabaseInPage();
getPageStructure();
getAllPagesContent().then((pages) => {
  console.log("\n✅ 최종 결과:");
  pages.forEach((page) => {
    console.log(`\n📑 ${page.title}:`);
    console.log("-------------------");
    console.log(page.content.slice(0, 200) + "..."); // 미리보기로 200자만
    console.log(`전체 내용 길이: ${page.content.length}자`);
  });
});
