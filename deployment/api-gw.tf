locals {
  api_prefix = "/api"
}

resource "aws_apigatewayv2_api" "api" {
  name          = local.project
  description   = "Audio Processor API"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age = 300
  }
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = local.project
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "upload_url_generator_integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_uri        = aws_lambda_function.upload_url_generator.invoke_arn
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "list_uploaded_files_integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_uri        = aws_lambda_function.list_uploaded_files.invoke_arn
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_url_generator_route" {
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = "POST ${local.api_prefix}/upload"
  target             = "integrations/${aws_apigatewayv2_integration.upload_url_generator_integration.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "list_uploaded_files_route" {
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = "GET ${local.api_prefix}/jobs"
  target             = "integrations/${aws_apigatewayv2_integration.list_uploaded_files_integration.id}"
  authorization_type = "NONE"
}
