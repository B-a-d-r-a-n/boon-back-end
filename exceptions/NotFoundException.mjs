class NotFoundException extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
  }
}
export default NotFoundException;