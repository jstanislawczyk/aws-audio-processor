resource "aws_dynamodb_table" "audio_processor_state" {
  name         = "${local.project}-audio-processor-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "createdAt"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }
}
