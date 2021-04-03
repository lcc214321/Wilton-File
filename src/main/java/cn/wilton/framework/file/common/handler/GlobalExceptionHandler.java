package cn.wilton.framework.file.common.handler;

import cn.wilton.framework.file.common.api.ResultCode;
import cn.wilton.framework.file.common.api.WiltonResult;
import cn.wilton.framework.file.common.exception.BizException;
import cn.wilton.framework.file.common.exception.WiltonException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.validation.Path;
import java.io.IOException;
import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Set;

/**
 * 全局统用异常处理器
 * @author Ranger
 * @email wilton.icp@gmail.com
 * @since 2021/3/15
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = WiltonException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult handleBaseException(WiltonException e) {
        log.error("Rocket Admin系统异常", e);
        return WiltonResult.failed(e.getMessage());
    }

    /**
     * 处理自定义的业务异常
     * @param e
     * @return
     */
    @ExceptionHandler(value = BizException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult bizExceptionHandler(BizException e){
        log.error("发生业务异常！原因是：{}",e.getErrorMsg());
        return WiltonResult.failed(e.getMessage());
    }

    /**
     * 处理空指针的异常
     * @param e
     * @return
     */
    @ExceptionHandler(value =NullPointerException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult exceptionHandler(NullPointerException e){
        log.error("发生空指针异常！原因是:",e);
        return WiltonResult.failed(ResultCode.BODY_NOT_MATCH);
    }

    @ExceptionHandler(value = IOException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult exceptionHandler(IOException e){
        log.error("发生异常！原因是:",e);
        return WiltonResult.failed(ResultCode.BODY_NOT_MATCH);
    }

    /**
     * 校验异常
     * @param e
     * @return
     */
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult exceptionHandler(MethodArgumentNotValidException e) {
        BindingResult bindingResult = e.getBindingResult();
        String errorMesssage = "";
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            errorMesssage += fieldError.getDefaultMessage() + "!";
        }
        log.error("参数异常:",e);
        return WiltonResult.failed(errorMesssage);
    }

    /**
     * 统一处理请求参数校验(实体对象传参)
     *
     * @param e BindException
     * @return WiltonResult
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult handleBindException(BindException e) {
        StringBuilder message = new StringBuilder();
        List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
        for (FieldError error : fieldErrors) {
            message.append(error.getField()).append(error.getDefaultMessage()).append(",");
        }
        message = new StringBuilder(message.substring(0, message.length() - 1));
        return WiltonResult.failed(message.toString());
    }

    /**
     * 统一处理请求参数校验(普通传参)
     *
     * @param e ConstraintViolationException
     * @return WiltonResult
     */
    @ExceptionHandler(value = ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult handleConstraintViolationException(ConstraintViolationException e) {
        StringBuilder message = new StringBuilder();
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        for (ConstraintViolation<?> violation : violations) {
            Path path = violation.getPropertyPath();
            String[] pathArr = StringUtils.splitByWholeSeparatorPreserveAllTokens(path.toString(), ".");
            message.append(pathArr[1]).append(violation.getMessage()).append(",");
        }
        message = new StringBuilder(message.substring(0, message.length() - 1));
        return WiltonResult.failed(message.toString());
    }

    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult handleWiltonException(WiltonException e) {
        log.error("系统内部异常，异常信息", e);
        return WiltonResult.failed(e.getMessage());
    }


    @ExceptionHandler(value = AccessDeniedException.class)
    @ResponseStatus(HttpStatus.OK)
    public WiltonResult handleAccessDeniedException(){
        return WiltonResult.failed(ResultCode.FORBIDDEN);
    }
}
