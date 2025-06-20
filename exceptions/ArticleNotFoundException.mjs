import NotFoundException from "./NotFoundException.mjs";
class ArticleNotFoundException extends NotFoundException {
  constructor(id) {
    super(`Article with id ${id} wasn't found`);
  }
}
export default ArticleNotFoundException;