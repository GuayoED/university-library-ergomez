"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";
import dayjs from "dayjs";

export const borrowBook = async (params: BorrowBookParams) => {
    const { bookId, userId } = params;

    console.log(bookId + "bookId");
    console.log(userId + "userId");

    try {
        const book = await db
          .select({availableCopies: books.availableCopies})
          .from(books)
          .where(eq(books.id, bookId))
          .limit(1);

        if(!book.length || book[0].availableCopies <= 0) {
            return {
                success: false,
                message: "The book is not available for borrowing."
            };
        }

        const dueDate = dayjs().add(7, "days").toDate().toDateString();

        const record = db.insert(borrowRecords).values({
            userId,
            bookId,
            dueDate,
            status: "BORROWED",
        });

        await db
          .update(books)
          .set({availableCopies: book[0].availableCopies - 1})
          .where(eq(books.id, bookId));

        return {
            success: true,
            message: "The book has been borrowed successfully.",
            data: record,
        };
    } catch (error) {
        return {
            success: false, 
            message: "An error occurred while borrowing the book.",
            message_error: error
        };
    }
};
