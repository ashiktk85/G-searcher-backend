import { SearchService } from '../services/search.service.js';

export class SearchController {
    static async getSearch(req, res, next) {
        try {
            const { query } = req.body;
            console.log(query,"query");
            
            if (!query) {
                return res.status(400).json({ error: "Enter text to search" });
              }
                const results = await SearchService.search(query);
            return res.json(results);
        } catch (error) {
            next(error);
        }
    }
}